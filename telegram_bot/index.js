const { Api, JsonRpc, RpcError } = require('eosjs');const fetch = require('node-fetch');    
const TelegramBot = require('node-telegram-bot-api');
const { TextEncoder, TextDecoder } = require('util');
const { hexToUint8Array, deserializeArray } = require("eosjs/dist/eosjs-serialize");
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

const proposals = [];
let globalAccounts, accountThreshold;
const mainnet_endpoint = 'http://api.eossweden.org'
const hyperion_endpoint = 'https://eos.hyperion.eosrio.io'
const fetch_proposal_timeout = 60 * 60 * 1000; // 1 hour
const alive_timoute = 24 * 60 * 60 * 1000 * 7; // 7 days
const bot_token = process.env.BOT_TOKEN // DAPP
const bot_chatID = process.env.BOT_CHAT_ID // DAPP
const bot_chatID_Guardians = process.env.BOT_CHAT_ID_GUARDIANS // DAPP guardians 
const defaultPrivateKey = "5JtUScZK2XEp3g9gh7F8bwtPTRAkASmNrrftmx4AxDKD5K4zDnr"; // eosio doc private key to init api

const delay = s => new Promise(res => setTimeout(res, s * 1000));
const signatureProvider = new JsSignatureProvider([defaultPrivateKey]);
const rpc = new JsonRpc(mainnet_endpoint, { fetch });
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(bot_token, {polling: true});

const sendUpdate = async (message, endpoint, msgStatus, res) => {
    let requested_approvals = '', provided_approvals = ''; 
    for(const el of message.requested_approvals) {
        requested_approvals ? requested_approvals += `,${el.actor}@${el.permission}` : requested_approvals += `${el.actor}@${el.permission}`
    }
    for(const el of message.provided_approvals) {
        provided_approvals ? provided_approvals += `,${el.actor}@${el.permission}` : provided_approvals += `${el.actor}@${el.permission}`
    }
    const send_message = `${msgStatus} ${endpoint}\n\nProposer: ${message.proposer}\nProposal name: ${message.proposal_name}\nExecuted: ${message.executed}\nRequested approvals: ${requested_approvals ? requested_approvals: ''}\nProvided approvals: ${provided_approvals ? provided_approvals : ''}`
    console.log(`${send_message}\n`);
    await bot.sendMessage(bot_chatID, send_message);
    if(res == "all") {
        await bot.sendMessage(bot_chatID_Guardians, send_message);
    }
}

const verifyReqSigs = async (requested_approvals) => {
    let count = 0;
    for(requested_approval of requested_approvals) {
        if(globalAccounts.includes(requested_approval.actor)) count++;
    }
    if(count >= accountThreshold) {
        return "all";
    } else if(count >= 1) {
        return "internal";
    }
}

const verifyMsig = async (proposal) => {
    const info = await rpc.get_table_rows({
        code: "eosio.msig",
        index_position: 1,
        json: true,
        limit: 1,
        lower_bound: proposal.proposal_name,
        upper_bound: proposal.proposal_name,
        reverse: false,
        scope: proposal.proposer,
        show_payer: false,
        table: "proposal"
    });
    if(!info.rows.length) {
        console.log('Proposal already executed\n');
        return false;
    }
    for(const row of info.rows) {
        const deserializedTrx = api.deserializeTransaction(hexToUint8Array(row.packed_transaction));
        if(JSON.stringify(deserializedTrx.actions).includes('dappservices') || JSON.stringify(deserializedTrx.actions).includes('dappgovernor')) {
            // ensure msig not expired
            if(new Date() < new Date(deserializedTrx.expiration)) {
                // check at least 11 matching sigs
                return await verifyReqSigs(proposal.requested_approvals);
            }
        }
    }
    console.log('Not related to dappservices or dappgovernor\n');
    return false;
}

const fetchProposal = async (resJson) => {
    for(const el of resJson.proposals) {
        let endpoint = `https://bloks.io/msig/${el.proposer}`
        // check proposal
        if(!proposals.length) {
            proposals.push(el);
            const msg = el.executed ? "Msig proposal executed" : "New msig proposal submitted"
            const res = await verifyMsig(el);
            if(res != false) await sendUpdate(el, `${endpoint}/${el.proposal_name}`, msg, res);
            console.log('First proposal\n');
            continue;
        }
        let already_exists = false, proposal_msg = "Msig proposal update";
        for(const elem of proposals) {
            // check that proposal is same, executed status same, provided approvals same, if not broadcast update
            if(JSON.stringify(elem) === JSON.stringify(el)) {
                already_exists = true;
            }
        }
        if(already_exists === false) {
            proposals.push(el);
            const res = await verifyMsig(el)
            if(res != false) await sendUpdate(el, `${endpoint}/${el.proposal_name}`, proposal_msg, res);
        }
    }
}

const fetchAccount = async (account) => {
    let accounts = ["dappservices"];
    const info = await rpc.get_account(account);
    // const info = await rpc.get_account('dadbountydao');
    for(const el of info.permissions) {
        for(const elem of el.required_auth.accounts) {
            accounts.push(elem.permission.actor);
        }
        if(el.perm_name == "owner") {
            accountThreshold = el.required_auth.threshold;
        }
    }
    return accounts
}

const fetchProposals = async () => {
    globalAccounts = await fetchAccount('dappgovernor');
    for(const account of globalAccounts) {
        console.log(`Fetching proposals related to: ${account}\n`);
        let res = await fetch(`${hyperion_endpoint}/v2/state/get_proposals?account=${account}`);
        await fetchProposal(await res.json());
        await delay(5);
    }
};

const stillAlive = async () => {
    await bot.sendMessage(bot_chatID, 'Bot still alive!');
}

(() => {
    setInterval(fetchProposals, fetch_proposal_timeout);
    setInterval(stillAlive, alive_timoute);
})()
