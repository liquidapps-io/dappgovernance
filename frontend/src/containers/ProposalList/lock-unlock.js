import {Fragment, useEffect, useState} from "react";
import {useHistory} from "react-router-dom";
import {ErrorMessage, Field, Form, Formik} from "formik";
import * as Yup from 'yup'
import '../../styles/proposalList.css'
import {
    eosjsEndPoint,
    LiquidBalance,
    LockTableData,
    LockTableFirstStep,
    LockTableSecondStep,
    UnlockTableContract,
    UnLockTableData
} from "../../utils/constants";
import EosApi from "eosjs-api";
import WalletProvider from "../../utils/wallet";
import {generateError} from "../../utils/helpers";
import {useToasts} from "react-toast-notifications";
import {useSelector} from "react-redux";
import Loader from "react-loader-spinner";

const LockUnlock = () => {

    const history = useHistory()

    const [loadingLock, setLockLoading] = useState(false)
    const [loadingUnlock, setUnlockLoading] = useState(false)

    const [lockedData, setLockedData] = useState({})
    const [unlockedData, setUnlockedData] = useState({})
    const [dappBalanceData, setDappBalanceData] = useState({})
    const {addToast} = useToasts()
    const walletConnected = useSelector((state) => state.user.walletConnected)

    const lockedFormInitialSchema = {
        amount: ''
    }

    const lockedFormValidationSchema = Yup.object({
        amount: Yup.string().required('Please enter amount')
    })

    const unlockedFormInitialSchema = {
        amount: ''
    }

    const unlockedFormValidationSchema = Yup.object({
        amount: Yup.string().required('Please enter amount')
    })


    const goToLockPage = () => {
        history.push('/lock')
    }

    const goToHomePage = () => {
        history.push('/')
    }

    const options = {
        httpEndpoint: eosjsEndPoint
    }

    const eos = EosApi(options)


    const getLockUnlockTableRows = async () => {

        try {
            const wallet = WalletProvider.getWallet()
            if (!!wallet) {
                const lockTableRows = await eos.getTableRows({
                    code: LockTableData.code,
                    table: LockTableData.table,
                    scope: LockTableData.scope,
                    json: 'true',
                    lower_bound: wallet?.auth?.accountName,
                    upper_bound: wallet?.auth?.accountName,
                })

                const unlockTableRows = await eos.getTableRows({
                    code: UnLockTableData.code,
                    table: UnLockTableData.table,
                    scope: UnLockTableData.scope,
                    json: 'true',
                    lower_bound: wallet?.auth?.accountName,
                    upper_bound: wallet?.auth?.accountName,
                })

                const liquidBalanceTableRows = await eos.getTableRows({
                    code: LiquidBalance.code,
                    table: LiquidBalance.table,
                    scope: wallet?.auth?.accountName,
                    json: 'true',
                })

                console.log('table rows called', lockTableRows, unlockTableRows, liquidBalanceTableRows)
                if (lockTableRows && lockTableRows.rows.length > 0) {
                    setLockedData(lockTableRows.rows[0])
                }
                if (unlockTableRows && unlockTableRows.rows.length > 0) {
                    setUnlockedData(unlockTableRows.rows[0])
                }
                if (liquidBalanceTableRows && liquidBalanceTableRows.rows.length > 0) {
                    setDappBalanceData(liquidBalanceTableRows.rows[0])
                }
            }
        } catch (e) {
            console.log('something went wrong in fetching balance', e)
        }
    }


    const handleLockAction = async (values) => {

        try {
            setLockLoading(true)
            const wallet = WalletProvider.getWallet()

            const enteredAmount = parseFloat(values.amount).toFixed(4) + ' DAPP';
            console.log('entered amount', enteredAmount)

            if (!!wallet) {
                await wallet.eosApi.transact({
                        actions: [
                            {
                                account: LockTableFirstStep.account,
                                name: LockTableFirstStep.name,
                                authorization: [
                                    {
                                        actor: wallet?.auth?.accountName,
                                        permission: wallet?.auth?.permission
                                    }
                                ],
                                data: {
                                    from: wallet?.auth?.accountName,
                                    to: LockTableFirstStep.to,
                                    quantity: enteredAmount, //staked entered amount
                                    memo: LockTableFirstStep.memo
                                }
                            },
                            {
                                account: LockTableSecondStep.account,
                                name: LockTableSecondStep.name,
                                authorization: [
                                    {
                                        actor: wallet?.auth?.accountName,
                                        permission: wallet?.auth?.permission
                                    }
                                ],
                                data: {
                                    account: wallet?.auth?.accountName,
                                    quantity: enteredAmount // enterd amount stake
                                }
                            }
                        ]
                    },
                    {
                        broadcast: true,
                        blocksBehind: 3,
                        expireSeconds: 60
                    }
                )
                addToast('Successfully locked', {appearance: 'success', autoDismiss: true})
            }

        } catch (e) {
            console.log('something went wrong ', e)
            addToast(generateError(e, 'Locking Failed'), {appearance: 'error', autoDismiss: true})

        } finally {
            setLockLoading(false)
        }
    }

    const handleUnLockAction = async (values) => {

        try {
            setUnlockLoading(true)
            const wallet = WalletProvider.getWallet()

            const enteredAmount = parseFloat(values.amount).toFixed(4) + ' DAPP';
            console.log('entered amount', enteredAmount)

            if (!!wallet) {
                await wallet.eosApi.transact({
                        actions: [
                            {
                                account: UnlockTableContract.account,
                                name: UnlockTableContract.name,
                                authorization: [
                                    {
                                        actor: wallet?.auth?.accountName,
                                        permission: wallet?.auth?.permission
                                    }
                                ],
                                data: {
                                    receiver: wallet?.auth?.accountName,
                                    quantity: enteredAmount
                                }
                            }
                        ]
                    },
                    {
                        broadcast: true,
                        blocksBehind: 3,
                        expireSeconds: 60
                    }
                )
                addToast('Amount Unlocked', {appearance: 'success', autoDismiss: true})
            }

        } catch (e) {
            console.log('something went wrong ', e)
            addToast(generateError(e, 'Something went wrong'), {appearance: 'error', autoDismiss: true})

        } finally {
            setUnlockLoading(false)
        }
    }


    useEffect(() => {
        getLockUnlockTableRows()
    }, [walletConnected])

    return (
        <Fragment>


            <div className="rectangleBox" style={{background: 'url("/images/rectangle.png")'}}/>
            <div className="rectangleBoxSmall" style={{background: 'url("/images/rect-small.png")'}}/>
            <div className="ellBoxSmall" style={{background: 'url("/images/ell-small.png")'}}/>
            <div className="ellBox" style={{background: 'url("/images/ell-big.png")'}}/>
            <div className="rectBig" style={{background: 'url("/images/rect-big.png")'}}/>

            <div className="container-fluid mt-5">
                <div className="container90">
                    <div className="col-md-12">

                        <div className="row">
                            <div className="nameWidth" onClick={goToHomePage}>
                                <h1 className="mainHeading">
                                    Governance Proposals
                                </h1>
                            </div>
                            <div className="nameWidth" onClick={goToLockPage}>
                                <h1 className="mainHeading active">
                                    DAPP tokens
                                </h1>
                                <div className="lineTag"/>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <div className="borderdForm">
                                    <h2 className="borderedFormHeading"> LOCK </h2>

                                    <p>
                                        <span className="keyFormHeading"> Available balance : </span>
                                        <span className="valueFormHeading">
                                            {dappBalanceData.balance}
                                        </span>
                                    </p>

                                    <div>
                                        <Formik initialValues={lockedFormInitialSchema}
                                                validationSchema={lockedFormValidationSchema}
                                                onSubmit={handleLockAction}>
                                            <Form className="form-inline customForm">
                                                <Field name="amount" type="text"
                                                       className="form-control primaryInput mr-3"
                                                       placeholder="Enter Amount"/>
                                                <button className="btn btn-primary connectBtn" disabled={loadingLock}>
                                                    {loadingLock ? <Loader color={"#fff"} type="Oval" width={40}
                                                                           height={25}/> : 'LOCK'}
                                                </button>
                                                <p className="text-danger mt-2 errorInput">
                                                    <ErrorMessage name="amount"/>
                                                </p>
                                            </Form>
                                        </Formik>


                                    </div>

                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="borderdForm">
                                    <h2 className="borderedFormHeading"> UNLOCK </h2>

                                    <p>
                                        <span className="keyFormHeading"> Available balance : </span>
                                        <span className="valueFormHeading">
                                            {lockedData.balance}
                                        </span>
                                    </p>

                                    <Formik initialValues={unlockedFormInitialSchema}
                                            validationSchema={unlockedFormValidationSchema}
                                            onSubmit={handleUnLockAction}>
                                        <Form className="form-inline customForm">
                                            <Field name="amount" type="text"
                                                   className="form-control primaryInput mr-3"
                                                   placeholder="Enter Amount"/>
                                            <button className="btn btn-primary connectBtn" disabled={loadingUnlock}>
                                                {loadingUnlock ? <Loader color={"#fff"} type="Oval" width={40}
                                                                         height={25}/> : 'UNLOCK'}
                                            </button>
                                            <p className="text-danger mt-2 errorInput">
                                                <ErrorMessage name="amount"/>
                                            </p>
                                        </Form>
                                    </Formik>

                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </div>

        </Fragment>
    )
}

export default LockUnlock