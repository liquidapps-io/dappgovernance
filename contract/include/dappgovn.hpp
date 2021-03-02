#include <eosio/eosio.hpp>
#include <eosio/singleton.hpp>
#include <eosio/asset.hpp>
#include <eosio/transaction.hpp>
using namespace eosio;
using namespace std;

CONTRACT dappgovn : public contract
{
public:
    using contract::contract;
    [[eosio::action]] void setconfig(asset proposer_fee, uint32_t accept_vote_per, uint32_t approved_vote_per, symbol tokensymbol,
                                     name tokencontract, uint32_t timelock_hours, uint32_t approval_hours, uint32_t accepted_hours, uint32_t unlock_hours,
                                     name feecontract, asset userreward, name rewardacc, asset minlockamt);
    [[eosio::action]] void createprop(name proposer, string title, string summary, string ipfsurl, asset max_reward);
    [[eosio::action]] void vote(name voter, uint64_t proposal_id, uint8_t vote_side);
    [[eosio::action]] void updatetally(uint64_t proposal_id);
    [[eosio::action]] void lock(name account, asset quantity);
    [[eosio::action]] void unlock(name receiver, asset quantity);
    [[eosio::action]] void refund(name account);
    [[eosio::action]] void cleanup(uint64_t proposal_id);
    [[eosio::action]] void implement(uint64_t proposal_id);
    [[eosio::action]] void feecheck(uint64_t proposal_id, name proposer, asset feeamt, std::string message);
    void transfer(name from, name to, asset quantity, string memo);

private:
    name checkauthorizer(name actioncall)
    {
        auto size = transaction_size();
        char buf[size];
        uint32_t read = read_transaction(buf, size);
        check(size == read, "read_transaction failed");
        auto tx = unpack<transaction>(buf, size);
        for (auto last = tx.actions.begin(); last != tx.actions.end(); ++last)
        {
            if (last->name == actioncall)
            {
                return last->authorization[0].actor;
            }
        }
        // return _self;
    }
    struct [[eosio::table]] settings
    {
        asset proposer_fee;
        uint32_t accept_vote_per;
        uint32_t approved_vote_per;
        symbol tokensymbol;
        name tokencontract;
        name feescontract;
        uint32_t timelock_hours;
        uint32_t approval_hours;
        uint32_t accepted_hours;
        uint32_t unlock_hours;
        asset userreward;
        name rewardacc;
        asset minlockamt;
    };
    typedef singleton<"setting"_n, settings> settings_index;
    typedef eosio::multi_index<"setting"_n, settings> dummy_for_abi;

    struct [[eosio::table]] prop_struct
    {
        uint64_t id;
        name proposer;
        string title;
        string summary;
        string ipfsurl;
        time_point_sec created_at;
        string status;
        time_point_sec approved_at;
        time_point_sec accepted_at;
        time_point_sec rejected_at;
        bool vote_active;
        bool isapproved;
        asset max_reward;

        auto primary_key() const { return id; }
        uint64_t by_proposer() const { return proposer.value; }
    };
    typedef eosio::multi_index<"proposals"_n, prop_struct> proposal_index;

    struct [[eosio::table]] staking
    {
        name account;
        asset balance;

        uint64_t primary_key() const { return account.value; }
    };
    typedef eosio::multi_index<"locked"_n, staking> staking_index;

    struct [[eosio::table]] unstaking
    {
        name account;
        asset unlocked;
        time_point_sec expiration;

        uint64_t primary_key() const { return account.value; }
    };
    typedef eosio::multi_index<"unlocking"_n, unstaking> unstaking_index;

    struct [[eosio::table]] totalstake
    {
        uint8_t id;
        asset balance;

        uint64_t primary_key() const { return id; }
    };
    typedef eosio::multi_index<"totallocked"_n, totalstake> totalstake_index;

    struct [[eosio::table]] voteconfig
    {
        uint64_t proposal_id;
        asset vote_yes;
        asset vote_no;
        asset total_votes;

        uint64_t primary_key() const { return proposal_id; }
    };
    typedef eosio::multi_index<"votes"_n, voteconfig> vote_index;

    struct [[eosio::table]] voter
    {

        name voter;
        uint8_t vote_side;
        asset vote;

        uint64_t primary_key() const
        {
            return voter.value;
        }
    };
    typedef eosio::multi_index<"voters"_n, voter> voter_index;

    struct [[eosio::table]] deposits
    {
        name account;
        asset balance;

        uint64_t primary_key() const { return account.value; }
    };
    typedef eosio::multi_index<"deposits"_n, deposits> deposits_tab;

    struct [[eosio::table]] currency_stats
    {
        asset supply;
        asset max_supply;
        name issuer;

        uint64_t primary_key() const { return supply.symbol.code().raw(); }
    };
    typedef eosio::multi_index<"stat"_n, currency_stats> stats;
};
