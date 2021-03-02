import {Fragment, useState} from "react";
import WalletProvider from '../../utils/wallet'
import {login} from '../../redux/actions/actions'
import {useDispatch, useSelector} from 'react-redux'
import {StorageKey} from "../../utils/constants";
import {useToasts} from 'react-toast-notifications'
import {hideConnectModal} from "../../redux/actions/ModalActions";
import Loader from "react-loader-spinner";


const ConnectTokenModal = () => {

    const dispatch = useDispatch()
    const selector = useSelector(state => state)

    const {addToast} = useToasts()

    const tokenList = [
        {
            image: "/images/tokens/scatter.png",
            name: "Scatter",
            index: 0
        },
        {
            image: "/images/tokens/tokenPocket.png",
            name: "Token Pocket",
            index: 1,
        },
        {
            image: "/images/tokens/anchor.svg",
            name: "Anchor",
            index: 2
        },

    ]


    const [loading, setLoading] = useState(false)
    const [active, setActive] = useState(-1)

    const closeModal = () => {
        dispatch(hideConnectModal())
    }

    const connectWallet = async (index) => {
        try {
            setActive(index)
            setLoading(true)
            await WalletProvider.login(index)
            const wallet = WalletProvider.getWallet()
            dispatch(login({username: wallet?.auth?.accountName}))
            addToast('Wallet Connected', {appearance: 'success', autoDismiss: true})
            localStorage.setItem(StorageKey.walletType, index.toString())
        } catch (e) {
            addToast('Failed to connect', {appearance: 'error', autoDismiss: true})
        } finally {
            setLoading(false)
            setActive(-1)
            closeModal()
        }
    }


    return (
        <Fragment>
            <div
                className={`modal modal-backdrop modalBlueBg connectTokenModal ${selector.modals.connectTokenModal ? 'show' : ''} `}
                tabIndex="-1"
                role="dialog">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">

                        <div className="modal-body">

                            <div className="d-flex flex-row mt-3">
                                <h5 className="connectTokenModalHeading">
                                    Select a wallet
                                </h5>
                                <div className="ml-auto mtb-auto">
                                    <button type="button" onClick={closeModal}
                                            className="close text-white pull-right">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                            </div>

                            {tokenList.map((token) => {
                                return (
                                    <Fragment>
                                        <div className="connectTokenBorder" onClick={() => connectWallet(token.index)}>
                                            <div className="col-md-12">
                                                <div className="row">
                                                    <div className="col-md-10">
                                                        <h4 className="connectTokenName">
                                                            <img src={token.image}
                                                                 alt={token.name}
                                                                 className="connectTokenImg"/>
                                                            {token.name}
                                                        </h4>
                                                    </div>
                                                    <div className="col-md-2">
                                                        {(loading && active === token.index) &&
                                                        <div className="loaderConnect">
                                                            <Loader color={"#fff"} type="Oval" width={40} height={45}/>
                                                        </div>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Fragment>
                                )
                            })
                            }


                        </div>

                    </div>
                </div>
            </div>
        </Fragment>
    )
}

export default ConnectTokenModal