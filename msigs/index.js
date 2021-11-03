const { Api, JsonRpc, RpcError, Serialize } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fetch = require('node-fetch');
const { TextEncoder, TextDecoder } = require('util');
const config = require('./secrets.json');

const defaultPrivateKey = config.private_key; // msig proposer
const signatureProvider = new JsSignatureProvider([defaultPrivateKey]);

const rpc = new JsonRpc('https://mainnet.eosn.io', { fetch });
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() })

const actions = [
    {
        account: "dappservices",
        name: "transfer",
        authorization: [
            {
                actor: "dappgovernor",
                permission: "owner"
            }
        ],
        data: {
            from: "dappgovernor",
            to: config.to,
            quantity: config.quantity,
            memo: config.memo
        }
    }
];

(async () => {
    const serialized_actions = await api.serializeActions(actions)

    // BUILD THE MULTISIG PROPOSE TRANSACTION
    const proposeInput = {
        proposer: config.msig_proposer,
        proposal_name: config.proposal_name,
        requested: [{"actor":"cbrftbkrwwbo","permission":"active"},{"actor":"codeguardian","permission":"active"},{"actor":"cryptolions1","permission":"gov"},{"actor":"dappnetworkk","permission":"active"},{"actor":"dappprovider","permission":"active"},{"actor":"doobiegalnew","permission":"active"},{"actor":"eospheredapp","permission":"active"},{"actor":"everythngeos","permission":"active"},{"actor":"igorlseosrio","permission":"guardian"},{"actor":"ihaveadejavu","permission":"active"},{"actor":"investingwad","permission":"active"},{"actor":"kawrrsytrsbq","permission":"active"},{"actor":"kobybenaroya","permission":"active"},{"actor":"larosenonaka","permission":"active"},{"actor":"mithrilalnce","permission":"active"},{"actor":"mwguardian12","permission":"active"},{"actor":"prjyzjtgxuku","permission":"active"},{"actor":"talmuskaleos","permission":"active"},{"actor":"x452ifggq5va","permission":"active"},{"actor":"xhfq33vt3fg2","permission":"active"},{"actor":"zkwshzdsgdiv","permission":"active"}],
        trx: {
            expiration: config.expiration,
            ref_block_num: 22480,
            ref_block_prefix: 3659047377,
            max_net_usage_words: 0,
            max_cpu_usage_ms: 0,
            delay_sec: 0,
            context_free_actions: [],
            actions: serialized_actions,
            transaction_extensions: []
        }
    };

    //PROPOSE THE TRANSACTION
    await api.transact({
        actions: [{
        account: 'eosio.msig',
        name: 'propose',
        authorization: [{
            actor: config.msig_proposer,
            permission: 'active',
        }],
        data: proposeInput,
        }]
    }, {
        blocksBehind: 3,
        expireSeconds: 30,
        broadcast: true,
        sign: true
    });
})();