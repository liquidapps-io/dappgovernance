import { initAccessContext, WalletAccessContext, Wallet } from 'eos-transit'
import scatter from 'eos-transit-scatter-provider'
import tokenpocket from 'eos-transit-tokenpocket-provider'
import AnchorLinkProvider from 'eos-transit-anchorlink-provider'
import { EndPointSettings, StorageKey } from './constants'

class WalletProvider {


    constructor() {

        this.accessContext = initAccessContext({
            appName: 'my_first_dapp',
            network: {
                host: EndPointSettings.endpoint,
                port: EndPointSettings.port,
                protocol: EndPointSettings.protocol,
                chainId: EndPointSettings.chainId
            },
            walletProviders: [
                scatter(),
                tokenpocket(),
                AnchorLinkProvider(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))
            ]
        })

        this.wallet = undefined
    }

    resetEndpoint(endpoint, dspprotocol) {
        console.log('endpoint---', endpoint, dspprotocol)
        this.accessContext = initAccessContext({
            appName: 'my_first_dapp',
            network: {
                host: endpoint,
                protocol: dspprotocol,
                chainId: EndPointSettings.chainId,
                port: EndPointSettings.port
            },
            walletProviders: [
                scatter(),
                tokenpocket(),
                AnchorLinkProvider(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))
            ]
        })
        const walletType = localStorage.getItem(StorageKey.walletType)
        console.log('wallet---tyoe---', walletType)
        if (!!walletType) {
            let index = parseInt(walletType)
            if (index >= 0) {
                this.login(index)
            }
        }
    }

    async login(index) {
        const walletProviders = this.accessContext.getWalletProviders()
        const selectedProvider = walletProviders[index]
        const wallet = this.accessContext.initWallet(selectedProvider)
        this.wallet = wallet

        await wallet.connect()
        await wallet.login()
    }

    getWallet() {
        return this.wallet
    }

    async disconnectWallet() {
        if (!!this.wallet) {
            await this.wallet.terminate()
            this.wallet = undefined
        }
    }
}

export default new WalletProvider()