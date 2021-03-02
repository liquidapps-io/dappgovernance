import 'bootstrap/dist/css/bootstrap.min.css'
import 'font-awesome/css/font-awesome.min.css'
import './App.css';
import {useEffect} from 'react'
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom'
import {useDispatch, useSelector} from 'react-redux'
import WalletProvider from './utils/wallet'
import {StorageKey} from './utils/constants'
import {useToasts} from "react-toast-notifications";
import ProposalLists from "./containers/ProposalList/proposal-list";
import ProposalDetail from "./containers/ProposalDetail/proposalDetail";
import Header from "./components/Header/Header";
import {login} from "./redux/actions/actions";
import LockUnlock from "./containers/ProposalList/lock-unlock";

function App() {

    const selector = useSelector(state => state)
    const dispatch = useDispatch()
    const {addToast} = useToasts()

    console.log('main state is', selector)

    useEffect(() => {
        const connectWallet = async (walletType) => {
            try {
                await WalletProvider.login(walletType)
                const wallet = WalletProvider.getWallet()

                if (!!wallet) {
                    dispatch(login({username: wallet?.auth?.accountName}))
                    addToast('Wallet Connected', {appearance: 'success', autoDismiss: true})

                }
            } catch (e) {
                console.log('something went wrong ', e)
                addToast('Failed to connect', {appearance: 'error', autoDismiss: true})
            }
        }

        const walletType = localStorage.getItem(StorageKey.walletType)

        if (!!walletType) {
            let wallet = parseInt(walletType)

            if (wallet >= 0) {
                connectWallet(wallet)
            }
        }
    }, [])

    return (
        <Router>
            <Header/>
            <Switch>
                <Route exact path='/' component={ProposalLists}/>
                <Route exact path='/lock' component={LockUnlock}/>
                <Route exact path='/proposal/detail/:proposalId' component={ProposalDetail}/>

            </Switch>
        </Router>
    );
}

export default App;
