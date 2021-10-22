//export const eosjsEndPoint = 'https://api.kylin.alohaeos.com' //test
export const eosjsEndPoint = 'https://api.main.alohaeos.com:443' // production


export const ProposerTable = {
    /* code: 'dappgovrnanc',
     table: 'proposal',
     scope: 'dappgovrnanc',
     limit: 500*/

    code: 'dappgovernor',
    table: 'proposals',
    scope: 'dappgovernor',
    limit: 500

}
export const ProposerMetaTable = {
    /*  code: 'dappgovrnanc',
      table: 'votes',
      scope: 'dappgovrnanc'*/

    code: 'dappgovernor',
    table: 'votes',
    scope: 'dappgovernor'
}

export const ProposerSupplyTable = {
    table: 'stat',
    account: 'dappservices',
    scope: 'DAPP'
}

export const LockTableData = {
    /* code: 'dappgovrnanc',
     table: 'stake',
     scope: 'dappgovrnanc'*/
    code: 'dappgovernor',
    table: 'locked',
    scope: 'dappgovernor'
}

export const UnLockTableData = {
    code: 'dappgovernor',
    table: 'unlocking',
    scope: 'dappgovernor'
}
export const LiquidBalance = {
    code: 'dappservices',
    table: 'accounts',
}

export const LockTableFirstStep = {
    account: 'dappservices',
    name: 'transfer',
    to: 'dappgovernor',
    memo: 'deposit for locking'
}

export const LockTableSecondStep = {
    account: 'dappgovernor',
    name: 'lock',
}

export const UnlockTableContract = {
    account: 'dappgovernor',
    name: 'unlock',
}

// code used

export const ContractNames = {
    dappGovernanceContract: 'dappgovernor',
    dadTokenContract: 'dadtoken1111',
    didIssueContract: 'dadtokenissu',
    eosDepositContract: 'depositeos11',
    eosPrizeDepositContract: 'depositeos22',
    dappDepositContract: 'depositdapp1',
    eosPoolContract: 'depositpool1',
    eosPrizePoolContract: 'depositpool5',
    dappPoolContract: 'depositpool2',
    boxvpPoolContract: 'depositpool3',
    deosTokenContract: 'deostoken111',
    ddappTokenContract: 'ddapptoken11',
    eosioTokenContract: 'eosio.token',
    dappServicesContract: 'dappservices',
    donationContract: 'hellodaddy11',
    boxvpContract: 'lptoken.defi',
    boxvpStakeContract: 'depositdadlp',
    boxwqStakeContract: 'depositpool4',
    boxvpTokenContract: 'lptoken.defi',
    dboxvpTokenContract: 'dtokenissuer',
    dppeosTokenContract: 'dtokenissuer',
    boxvpDepositContract: 'depositboxvp',
    boxwqPoolContract: 'depositpool4',
    dboxwqTokenContract: 'dtokenissuer',
    boxwqTokenContract: 'lptoken.defi',
    boxwqDepositContract: 'depositboxwq',
    rafflePoolContract: 'rafsubscribe',
    raffleDepositContract: 'rafdeposit11'
}

export const ContractTable = {
    stakeTable: 'stake2',
    balanceTable: 'accounts',
    rateTable: 'pricestat',
    dadBalanceTable: 'claimtab2',
    roundTable: 'rounddet1',
    dadStats: 'stat',
    eosPool: 'tokenstat1',
    dappPool: 'tokenstat1',
    dboxvpPool: 'tokenstat1',
    tokenDist: 'tokdistr2',
    boxvpStake: 'totalstake',
    boxwqStake: 'tokenstat1',
    weightTable: 'tottokdistr',
    eosPrizeTable: 'prizemoney',
    prizeWinnerTable: 'winnerlist',
    prizeRoundTable: 'rounddet',
    totalTiketsTable: 'totaltickets',
    userTicketsTable: 'usertickets',
    raffleTotalStake: 'totalstake',
    raffleUserCount: 'userpool',
    raffleRoundTab: 'poolround',
    raffleUserDeposit: 'userdeposit',
}

export const StorageKey = {
    walletType: 'walletType'
}


export const VoteTable = {
    /*account: 'dappgovrnanc',
    name: 'vote'*/

    account: 'dappgovernor',
    name: 'vote'
}

export const CreateProposalTable = {
    /*account: 'dappgovrnanc',
    name: 'proposal',*/

    account: 'dappgovernor',
    name: 'createprop',

}
export const GetVoteStatus = {
    code: 'dappgovernor',
    table: 'voters',
}

export const EndPointSettings = {
    protocol: 'https',
    endpoint: 'api.main.alohaeos.com', //'api.kylin.alohaeos.com'
    port: 443,
    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906' //'5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191'
}

// export const eosjsApiEndpoint = `${EndPointSettings.protocol}://${EndPointSettings.endpoint}`//:${EndPointSettings.port}


export const DspEndpoints = {
    eosusadsp: {
        protocol: 'https',
        endpoint: 'node1.eosdsp.com',
        port: 443,
        chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
    },
    blockstartdsp: {
        protocol: 'https',
        endpoint: 'node2.blockstartdsp.com',
        port: 443,
        chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
    },
    dappsolutions: {
        protocol: 'https',
        endpoint: 'dsp1tlv.dappsolutions.app',
        port: 443,
        chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
    }
}
