const { Api, JsonRpc, RpcError } = require('eosjs');const fetch = require('node-fetch');    
const { TextEncoder, TextDecoder } = require('util');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const config = require('./secrets.json');

let refunds = [];
const mainnet_endpoint = 'http://api.eossweden.org'
const hyperion_endpoint = 'https://eos.hyperion.eosrio.io'
const defaultPrivateKey = config.private_key; // eosio doc private key to init api
const fetchDeltasTimeout = 60 * 60 * 1000;

const code = "dappservices";
const table = "refunds";

const delay = s => new Promise(res => setTimeout(res, s * 1000));
const signatureProvider = new JsSignatureProvider([defaultPrivateKey]);
const rpc = new JsonRpc(mainnet_endpoint, { fetch });
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

const handleRefund = async (refund) => {
    let error = false;
    try {
        await api.transact({
            actions: [{
              account: code,
              name: 'refundto',
              authorization: [{
                actor: config.account,
                permission: 'active',
              }],
              data: {
                from: refund.from,
                to: refund.account,
                provider: refund.provider,
                service: refund.service,
                symcode: 'DAPP',
              },
            }]
          }, {
            blocksBehind: 3,
            expireSeconds: 30,
          });
    } catch(e) {
        console.log(e.message);
        error = true;
    }
    if(!error) {
        console.log(`processed and removing ${refund.account}`)
        refunds = refunds.filter(el => el != refund);
    } else {
        handleExists(refund);
    }
}

const handleExists = (refund) => {
    let exists = false;
    for(const elem of refunds) {
        if(JSON.stringify(elem) === JSON.stringify(refund)) {
            exists = true;
        }
    }
    if(!exists) {
        refunds.push(refund);
    }
}

const handleDelta = async (delta) => {
    let info;
    try {
        await delay(1);
        info = await rpc.get_table_rows({
            code,
            index_position: 1,
            json: true,
            limit: 99999,
            reverse: false,
            scope: delta.scope,
            show_payer: false,
            table
        });
    } catch(e) {
        console.log(e);
        return;
    }
    if(!info.rows.length) {
        console.log(`Refund already processed for ${delta.scope}`);
    } else {
        for(const row of info.rows) {
            const date = new Date(Number(row.unstake_time));
            const refund = {
                from: delta.scope,
                account: row.account,
                service: row.service,
                provider: row.provider,
                date
            }
            if(date < new Date()) {
                console.log(`refunding ${JSON.stringify(row)}`);
                await handleRefund(refund);
            } else {
                console.log(`adding ${delta.scope}:${row.account}`);
                handleExists(refund);
            }
        }
    }
}

const handleDeltas = async (deltas) => {
    for(const delta of deltas) {
        await handleDelta(delta);
    }
}

const fetchProposals = async () => {
    let res = await fetch(`${hyperion_endpoint}/v2/history/get_deltas?code=${code}&table=${table}&present=true`);
    try {
        await handleDeltas((await res.json()).deltas);
    } catch (e) {
        console.log(e);
    }
    console.log(JSON.stringify(refunds))
};

(() => {
    setInterval(fetchProposals, fetchDeltasTimeout);
})()