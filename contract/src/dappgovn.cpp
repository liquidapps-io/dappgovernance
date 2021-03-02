#include "../include/dappgovn.hpp"
#include <math.h>

ACTION dappgovn::setconfig(asset proposer_fee, uint32_t accept_vote_per, uint32_t approved_vote_per, symbol tokensymbol,
                           name tokencontract, uint32_t timelock_hours, uint32_t approval_hours, uint32_t accepted_hours, uint32_t unlock_hours,
                           name feecontract, asset userreward, name rewardacc, asset minlockamt)
{
    require_auth(_self);
    settings_index settings_table(_self, _self.value);
    settings new_settings;
    new_settings.proposer_fee = proposer_fee;
    new_settings.accept_vote_per = accept_vote_per;
    new_settings.approved_vote_per = approved_vote_per;
    new_settings.tokensymbol = tokensymbol;
    new_settings.feescontract = feecontract;
    new_settings.tokencontract = tokencontract;
    new_settings.timelock_hours = timelock_hours;
    new_settings.approval_hours = approval_hours;
    new_settings.accepted_hours = accepted_hours;
    new_settings.unlock_hours = unlock_hours;
    new_settings.userreward = userreward;
    new_settings.rewardacc = rewardacc;
    new_settings.minlockamt = minlockamt;
    settings_table.set(new_settings, _self);
}

ACTION dappgovn::createprop(name proposer, string title, string summary, string ipfsurl, asset max_reward)
{
    require_auth(proposer);
    check(title.size() < 1024, "title should be less than 1024 characters long.");
    settings_index settings_table(_self, _self.value);
    check(settings_table.exists(), "Config has not been set yet");
    auto st = settings_table.get();
    staking_index getuser(_self, _self.value);
    auto stk_itr = getuser.find(proposer.value);
    check(stk_itr != getuser.end(), "first lock proposal fee before creating proposal");
    check(stk_itr->balance.amount >= st.proposer_fee.amount, "Lock amount is less than proposal-fee");

    totalstake_index total_stake(_self, _self.value);
    auto totstk_itr = total_stake.begin();
    check(totstk_itr != total_stake.end(), "totallock table is not intilalized");

    proposal_index proposal_table(_self, _self.value);
    uint64_t proposalid = proposal_table.available_primary_key();

    proposal_table.emplace(proposer, [&](auto &row) {
        row.id = proposalid;
        row.proposer = proposer;
        row.title = title;
        row.summary = summary;
        row.ipfsurl = ipfsurl;
        row.created_at = current_time_point();
        row.status = "Created";
        row.vote_active = true;
        row.isapproved = false;
        row.max_reward = max_reward;
    });

    getuser.modify(stk_itr, proposer, [&](auto &row) {
        row.balance -= st.proposer_fee;
    });

    total_stake.modify(totstk_itr, same_payer, [&](auto &row) {
        row.balance -= st.proposer_fee;
    });

    asset temp = asset(0, st.tokensymbol);
    vote_index vote_table(_self, _self.value);
    auto vote_itr = vote_table.find(proposalid);
    check(vote_itr == vote_table.end(), "vote already intilalize for this proposal");
    vote_table.emplace(proposer, [&](auto &vote) {
        vote.proposal_id = proposalid;
        vote.vote_yes = temp;
        vote.vote_no = temp;
        vote.total_votes = temp;
    });

    action(
        permission_level{_self, "active"_n},
        _self,
        "feecheck"_n,
        std::make_tuple(proposalid, proposer, st.proposer_fee, std::string("Proposal fee deducted")))
        .send();
}

ACTION dappgovn::vote(name voter, uint64_t proposal_id, uint8_t vote_side)
{
    require_auth(voter);
    proposal_index proposal_table(_self, _self.value);
    auto prop_itr = proposal_table.find(proposal_id);
    check(prop_itr != proposal_table.end(), "proposal not create for this id");
    check(prop_itr != proposal_table.end(), "proposal not create for this id");
    check(prop_itr->vote_active, "vote is not active for this proposal");
    check(vote_side >= 0, "Invalid vote");
    settings_index settings_table(_self, _self.value);
    check(settings_table.exists(), "Config has not been set");
    auto st = settings_table.get();
    voter_index voter_table(_self, proposal_id);
    auto voter_itr = voter_table.find(voter.value);
    asset temp = asset(0, st.tokensymbol);
    staking_index getuser(_self, _self.value);
    auto stk_itr = getuser.find(voter.value);
    check(stk_itr != getuser.end() && stk_itr->balance != temp, "Lock before voting");
    vote_index vote_table(_self, _self.value);
    auto vote_itr = vote_table.find(proposal_id);
    check(vote_itr != vote_table.end(), "vote is not intilalized for this proposal");
    asset vote_yes = vote_itr->vote_yes;
    asset vote_no = vote_itr->vote_no;
    asset total_votes = vote_itr->total_votes;
    if (voter_itr != voter_table.end())
    {
        switch (vote_side)
        {
        case 1:
            if (voter_itr->vote_side == 1)
            {
                check(false, "Already voted for this option");
            }
            else if (voter_itr->vote_side == 0)
            {
                vote_no -= voter_itr->vote;
                vote_yes += stk_itr->balance;
                total_votes += stk_itr->balance - voter_itr->vote;
            }
            else
            {
                total_votes += stk_itr->balance - voter_itr->vote;
            }
            break;
        case 0:
            if (voter_itr->vote_side == 0)
            {
                check(false, "Already voted for this option");
            }
            else if (voter_itr->vote_side == 1)
            {
                vote_yes -= voter_itr->vote;
                vote_no += stk_itr->balance;
                total_votes += stk_itr->balance - voter_itr->vote;
            }
            else
            {
                total_votes += stk_itr->balance - voter_itr->vote;
            }
            break;
        default:
            if (voter_itr->vote_side == 1)
            {
                vote_yes -= voter_itr->vote;
                total_votes += stk_itr->balance - voter_itr->vote;
            }
            else if (voter_itr->vote_side == 0)
            {
                vote_no -= voter_itr->vote;
                total_votes += stk_itr->balance - voter_itr->vote;
            }
            else
            {
                check(false, "Already voted for this same option");
            }
            break;
        }
        voter_table.modify(voter_itr, voter, [&](auto &vtr) {
            vtr.vote_side = vote_side;
            vtr.vote = stk_itr->balance;
        });
        vote_table.modify(vote_itr, voter, [&](auto &row) {
            row.vote_yes = vote_yes;
            row.vote_no = vote_no;
            row.total_votes = total_votes;
        });
    }
    else if (voter_itr == voter_table.end())
    {
        switch (vote_side)
        {
        case 1:
            vote_yes += stk_itr->balance;
            total_votes += stk_itr->balance;
            break;
        case 0:
            vote_no += stk_itr->balance;
            total_votes += stk_itr->balance;
            break;
        default:
            total_votes += stk_itr->balance;
            break;
        }
        voter_table.emplace(voter, [&](auto &vtr) {
            vtr.voter = voter;
            vtr.vote_side = vote_side;
            vtr.vote = stk_itr->balance;
        });
        vote_table.modify(vote_itr, voter, [&](auto &row) {
            row.vote_yes = vote_yes;
            row.vote_no = vote_no;
            row.total_votes = total_votes;
        });
    }
}

void dappgovn::updatetally(uint64_t proposal_id)
{
    name authorizer = checkauthorizer("updatetally"_n);

    proposal_index proposal_table(_self, _self.value);
    auto prop_itr = proposal_table.find(proposal_id);
    check(prop_itr != proposal_table.end(), "proposal not create for this id");
    settings_index settings_table(_self, _self.value);
    check(settings_table.exists(), "Config has not been set");
    auto st = settings_table.get();
    totalstake_index total_stake(_self, _self.value);
    auto totstk_itr = total_stake.begin();
    check(totstk_itr != total_stake.end(), "totallock table is not intilalized");
    vote_index vote_table(_self, _self.value);
    auto vote_itr = vote_table.find(proposal_id);
    check(vote_itr != vote_table.end(), "vote is not intilalized for this proposal");
    check(prop_itr->vote_active, "vote has been finished for this proposal");
    stats statstable(st.tokencontract, st.tokensymbol.code().raw());
    auto existing = statstable.find(st.tokensymbol.code().raw());
    auto min_accept_vote = (existing->supply.amount * st.accept_vote_per) / 100;
    auto min_approved_vote = (totstk_itr->balance.amount * st.approved_vote_per) / 100; //change to total staked
    asset temp = asset(0, st.tokensymbol);
    asset vote_yes = asset(0, st.tokensymbol);
    asset vote_no = asset(0, st.tokensymbol);
    asset total_votes = asset(0, st.tokensymbol);
    bool isstatechanged = false;
    staking_index getuser(_self, _self.value);
    voter_index voter_table(_self, proposal_id);
    auto votr = voter_table.begin();
    if (votr != voter_table.end())
    {
        while (votr != voter_table.end())
        {
            auto stk_itr = getuser.find(votr->voter.value);
            if (stk_itr->balance != temp)
            {
                switch (votr->vote_side)
                {
                case 1:
                    vote_yes += stk_itr->balance;
                    total_votes += stk_itr->balance;
                    break;
                case 0:
                    vote_no += stk_itr->balance;
                    total_votes += stk_itr->balance;
                    break;
                default:
                    total_votes += stk_itr->balance;
                    break;
                }
            }
            voter_table.modify(votr, _self, [&](auto &vtr) {
                vtr.vote = stk_itr->balance;
            });
            votr++;
        }

        vote_table.modify(vote_itr, _self, [&](auto &row) {
            row.vote_yes = vote_yes;
            row.vote_no = vote_no;
            row.total_votes = total_votes;
        });
    }

    auto stk_itr = getuser.find(prop_itr->proposer.value);
    auto status = prop_itr->status;

    if (status == "Created")
    {
        time_point accept_time = prop_itr->created_at + st.accepted_hours * 60 * 60;
        if (current_time_point() <= accept_time)
        {
            if (total_votes.amount >= min_accept_vote)
            {
                isstatechanged = true;
                proposal_table.modify(prop_itr, _self, [&](auto &row) {
                    row.status = "Accepted";
                    row.accepted_at = current_time_point();
                });
                getuser.modify(stk_itr, _self, [&](auto &row) {
                    row.balance += st.proposer_fee;
                });
                total_stake.modify(totstk_itr, same_payer, [&](auto &row) {
                    row.balance += st.proposer_fee;
                });

                action(
                    permission_level{_self, "active"_n},
                    _self,
                    "feecheck"_n,
                    std::make_tuple(proposal_id, prop_itr->proposer, st.proposer_fee, std::string("Proposal fee returned")))
                    .send();
            }
        }
        else
        {
            isstatechanged = true;
            proposal_table.modify(prop_itr, _self, [&](auto &row) {
                row.status = "Expired";
                row.accepted_at = current_time_point();
                row.vote_active = false;
            });

            action(
                permission_level{_self, "active"_n},
                st.tokencontract,
                "transfer"_n,
                std::make_tuple(_self, st.feescontract, st.proposer_fee, std::string("return proposal fees")))
                .send();
        }
    }

    if (status == "Accepted")
    {
        time_point approval_time = prop_itr->accepted_at + st.approval_hours * 60 * 60;
        if ((current_time_point() <= approval_time))
        {
            if ((total_votes.amount >= min_approved_vote) && (vote_yes >= vote_no))
            {
                isstatechanged = true;
                proposal_table.modify(prop_itr, _self, [&](auto &row) {
                    row.status = "Approved";
                    row.approved_at = current_time_point();
                    row.isapproved = true;
                });
            }
            else if ((total_votes.amount >= min_approved_vote) && (vote_no > vote_yes))
            {
                isstatechanged = true;
                proposal_table.modify(prop_itr, _self, [&](auto &row) {
                    row.status = "Rejected";
                    row.rejected_at = current_time_point();
                });
            }
        }
        else
        {
            isstatechanged = true;
            proposal_table.modify(prop_itr, _self, [&](auto &row) {
                row.status = "Expired";
                row.vote_active = false;
            });
        }
    }
    if (status == "Approved")
    {
        time_point completed_time = prop_itr->approved_at + st.timelock_hours * 60 * 60;
        if (current_time_point() >= completed_time)
        {
            if (vote_yes >= vote_no)
            {
                isstatechanged = true;
                proposal_table.modify(prop_itr, _self, [&](auto &row) {
                    row.status = "Implemention-Queue";
                    row.vote_active = false;
                });
            }
            else if (vote_no > vote_yes)
            {
                isstatechanged = true;
                proposal_table.modify(prop_itr, _self, [&](auto &row) {
                    row.status = "Rejected";
                    row.rejected_at = prop_itr->approved_at; // to ensure we dont wait another timelock period, its time to cleanup, if we set curr time point then it wont cleanup now
                    row.vote_active = false;
                });
            }
        }
    }
    if (status == "Rejected")
    {
        time_point completed_time = prop_itr->rejected_at + st.timelock_hours * 60 * 60;
        if (current_time_point() >= completed_time)
        {
            if (vote_yes >= vote_no)
            {
                isstatechanged = true;
                proposal_table.modify(prop_itr, _self, [&](auto &row) {
                    row.status = "Implemention-Queue";
                    row.vote_active = false;
                });
            }
            else if (vote_no > vote_yes)
            {
                isstatechanged = true;
                proposal_table.modify(prop_itr, _self, [&](auto &row) {
                    row.status = "Rejected";
                    row.vote_active = false;
                });
            }
        }
    }

    if (isstatechanged)
    {
        //transfer reward amount to authorizer -- need to give eosio code permission to rewardacc
        action(
            permission_level{st.rewardacc, "active"_n},
            st.tokencontract,
            "transfer"_n,
            std::make_tuple(st.rewardacc, authorizer, st.userreward, std::string("updatetally reward")))
            .send();
    }
}

void dappgovn::cleanup(uint64_t proposal_id)
{
    proposal_index proposal_table(_self, _self.value);
    auto prop_itr = proposal_table.find(proposal_id);
    check(prop_itr != proposal_table.end(), "proposal not created for this id");

    check((has_auth(_self) || has_auth(prop_itr->proposer)), "Missing require auth");

    settings_index settings_table(_self, _self.value);
    check(settings_table.exists(), "Config has not been set");
    auto st = settings_table.get();
    time_point completed_time = prop_itr->rejected_at + st.timelock_hours * 60 * 60;
    if ((prop_itr->status == "Rejected") && (current_time_point() <= completed_time))
    {
        check(false, "proposal is in timelock");
    }
    check((prop_itr->status == "Expired") || (prop_itr->status == "Implemented") || (prop_itr->status == "Rejected"), "proposal status should be expired or Implemented or Rejected");
    vote_index vote_table(_self, _self.value);
    auto vote_itr = vote_table.find(proposal_id);
    check(vote_itr != vote_table.end(), "vote is not intilalized for this proposal");
    vote_itr = vote_table.erase(vote_itr);
    voter_index voter_table(_self, proposal_id);
    auto votr = voter_table.begin();
    while (votr != voter_table.end())
    {
        votr = voter_table.erase(votr);
    }
}

void dappgovn::implement(uint64_t proposal_id)
{
    require_auth(_self);
    proposal_index proposal_table(_self, _self.value);
    auto prop_itr = proposal_table.find(proposal_id);
    check(prop_itr->status == "Implemention-Queue", "only proposal in Implementation-Queue can be implemented");
    check(prop_itr != proposal_table.end(), "proposal not create for this id");
    proposal_table.modify(prop_itr, _self, [&](auto &row) {
        row.status = "Implemented";
    });
}

void dappgovn::feecheck(uint64_t proposal_id, name proposer, asset feeamt, std::string message)
{
    require_auth(_self);
}

void dappgovn::lock(name account, asset quantity)
{
    require_auth(account);
    settings_index settings_table(_self, _self.value);
    check(settings_table.exists(), "Config has not been set");
    auto st = settings_table.get();
    check(quantity.symbol == st.tokensymbol, "Incorrect token");
    check(quantity.is_valid(), "Invalid token transfer");
    check(quantity.amount > 0, "Quantity must be positive");
    deposits_tab deposits(_self, _self.value);
    auto depoitr = deposits.find(account.value);
    check((depoitr != deposits.end() && depoitr->balance >= quantity), "Not enough amount deposited");

    staking_index getuser(_self, _self.value);
    auto itr = getuser.find(account.value);
    if (itr == getuser.end())
    {
        getuser.emplace(account, [&](auto &row) {
            row.account = account;
            row.balance = quantity;
        });
    }
    else
    {
        getuser.modify(itr, account, [&](auto &row) {
            row.balance += quantity;
        });
    }
    totalstake_index total_stake(_self, _self.value);
    auto stk_itr = total_stake.begin();
    if (stk_itr == total_stake.end())
    {
        total_stake.emplace(_self, [&](auto &row) {
            row.id = total_stake.available_primary_key();
            row.balance = quantity;
        });
    }
    else
    {
        total_stake.modify(stk_itr, _self, [&](auto &row) {
            row.balance += quantity;
        });
    }

    auto amountleft = depoitr->balance - quantity;
    if (amountleft.amount > 0)
    {
        action(
            permission_level{_self, "active"_n},
            st.tokencontract,
            "transfer"_n,
            std::make_tuple(_self, account, amountleft, std::string("deposit amount return")))
            .send();
    }
    deposits.erase(depoitr);
}

void dappgovn::unlock(name account, asset quantity)
{
    require_auth(account);
    settings_index settings_table(_self, _self.value);
    check(settings_table.exists(), "Config has not been set");
    auto st = settings_table.get();

    check(quantity.symbol == st.tokensymbol, "Incorrect token");
    check(quantity.is_valid(), "Invalid token transfer");
    check(quantity.amount > 0, "Quantity must be positive");
    staking_index getuser(_self, _self.value);
    auto itr = getuser.find(account.value);
    totalstake_index total_stake(_self, _self.value);
    auto stk_itr = total_stake.begin();
    check(stk_itr != total_stake.end(), "totallock table is not intilalized");
    check(itr != getuser.end(), "Lock amount is not sufficient");
    check(itr->balance.amount >= quantity.amount, "unlock amount is greater than lock amount");

    unstaking_index unstaket(_self, _self.value);
    auto unstakeitr = unstaket.find(account.value);

    if (unstakeitr == unstaket.end())
    {
        unstaket.emplace(account, [&](auto &row) {
            row.account = account;
            row.unlocked = quantity;
            row.expiration = time_point_sec(current_time_point()) + st.unlock_hours * 60 * 60;
        });
    }
    else
    {
        unstaket.modify(unstakeitr, same_payer, [&](auto &row) {
            row.unlocked += quantity;
            row.expiration = time_point_sec(current_time_point()) + st.unlock_hours * 60 * 60;
        });
    }

    getuser.modify(itr, same_payer, [&](auto &row) {
        row.balance -= quantity;
    });

    total_stake.modify(stk_itr, _self, [&](auto &row) {
        row.balance -= quantity;
    });
}
void dappgovn::refund(name account)
{
    require_auth(account);
    settings_index settings_table(_self, _self.value);
    check(settings_table.exists(), "Config has not been set");
    auto st = settings_table.get();

    unstaking_index getuser(_self, _self.value);
    auto itr = getuser.find(account.value);
    check(itr != getuser.end(), "No pending unlock amount");
    check(itr->expiration <= current_time_point(), "Unlock amount not expired yet");

    action(
        permission_level{_self, "active"_n},
        st.tokencontract,
        "transfer"_n,
        std::make_tuple(_self, account, itr->unlocked, std::string("unlock amount refund")))
        .send();

    getuser.erase(itr);
}
void dappgovn::transfer(name from, name to, asset quantity, string memo)
{
    settings_index settings_table(_self, _self.value);
    check(settings_table.exists(), "Config has not been set");
    auto st = settings_table.get();
    check(quantity.symbol == st.tokensymbol, "Incorrect token");
    check(quantity.is_valid(), "Invalid token transfer");
    check(quantity.amount > 0, "Quantity must be positive");
    check(quantity >= st.minlockamt, "Deposit must be greater than minimum-lock amount");
    if (to == _self)
    {
        if (_first_receiver == st.tokencontract)
        {
            asset balance = quantity;
            deposits_tab deposits(_self, _self.value);
            auto itr = deposits.find(from.value);
            if (itr == deposits.end())
            {
                deposits.emplace(_self, [&](auto &a) {
                    a.account = from;
                    a.balance = quantity;
                });
            }
            else
            {
                deposits.modify(itr, _self, [&](auto &a) {
                    a.balance += quantity;
                });
            }
        }
        else
        {
            check(false, "Token not accepted");
        }
    }
}
extern "C"
{
    [[noreturn]] void apply(uint64_t receiver, uint64_t code, uint64_t action)
    {
        if (action == "transfer"_n.value && code != receiver)
        {
            eosio::execute_action(eosio::name(receiver), eosio::name(code), &dappgovn::transfer);
        }
        if (code == receiver)
        {
            switch (action)
            {
                EOSIO_DISPATCH_HELPER(dappgovn, (setconfig)(createprop)(vote)(updatetally)(lock)(unlock)(refund)(cleanup)(implement));
            }
        }
        eosio_exit(0);
    }
}
