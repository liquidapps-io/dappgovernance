import {Fragment} from "react";
import '../../styles/Header.css'
import {showConnectModal} from "../../redux/actions/ModalActions";
import {useDispatch, useSelector} from "react-redux";
import WalletProvider from '../../utils/wallet'
import {logout} from '../../redux/actions/actions'
import ConnectTokenModal from "../ConnectTokenModal/ConnectTokenModal";
import {useToasts} from "react-toast-notifications";
import {StorageKey} from "../../utils/constants";

const Header = () => {

    const dispatch = useDispatch()
    const username = useSelector((state) => state.user.username)
    const walletConnected = useSelector((state) => state.user.walletConnected)
    const {addToast} = useToasts()

    const handleOpenConnectModal = async () => {

        if (walletConnected) {
            try {
                const wallet = WalletProvider.getWallet()
                if (!!wallet) {
                    await WalletProvider.disconnectWallet()
                    dispatch(logout())
                    addToast('Logout Successful', {appearance: 'success', autoDismiss: true})
                    localStorage.removeItem(StorageKey.walletType)
                }
            } catch (e) {
                console.log('something went wrong ', e)
                addToast('Something went wrong', {appearance: 'error', autoDismiss: true})
            }
        } else {
            dispatch(showConnectModal())
        }
    }

    return (
        <Fragment>

            <div className="container-fluid">
                <div className="container90">
                    <div className="col-md-12">
                        <div className="row d-flex flex-row headerBlock">
                            <div className="">
                                <button className="btn primaryButton btnHeader">
                                    <i className="fa fa-globe pr-2"/> English
                                </button>

                            </div>
                            <div className="ml-auto">
                                <img src="/images/logo-white.png" className="headerLogo"
                                     alt="logo"/>
                            </div>

                            <div className="ml-auto">
                                <button className="btn primaryButton btnHeader connectBtn"
                                        onClick={handleOpenConnectModal}>
                                    {walletConnected ? 'logout' : 'connect'}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <ConnectTokenModal/>


        </Fragment>
    )
}

export default Header