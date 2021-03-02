import {Fragment, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import WalletProvider from "../../utils/wallet";
import {ErrorMessage, Field, Form, Formik} from 'formik'
import * as Yup from 'yup'
import {CreateProposalTable} from "../../utils/constants";
import {hideCreateProposalModal} from "../../redux/actions/ModalActions";
import Loader from "react-loader-spinner";
import {generateError} from "../../utils/helpers";
import {useToasts} from "react-toast-notifications";


const CreateProposalModal = (props) => {

    const dispatch = useDispatch()
    const selector = useSelector(state => state)
    const {addToast} = useToasts()

    const createProposalInitialSchema = {
        title: '',
        summary: '',
        ipfsUrl: '', // optional
        maxReward: '',
        token: 'DAPP'
    }

    const createProposalValidationSchema = Yup.object().shape({
        title: Yup.string().required('Please enter title'),
        summary: Yup.string().required('Please enter Summary'),
        maxReward: Yup.string().required('Please enter Max Reward Value'),
    })

    const [loading, setLoading] = useState(false)

    const handleCreateProposal = async (values) => {
        try {
            setLoading(true)
            const wallet = WalletProvider.getWallet()
            const {title, summary, maxReward, ipfsUrl, token} = values

            const maxRewardNew = parseFloat(maxReward).toFixed(4) + token

            if (!!wallet) {
                const response = await wallet.eosApi.transact({
                        actions: [
                            {
                                account: CreateProposalTable.account,
                                name: CreateProposalTable.name,
                                authorization: [
                                    {
                                        actor: wallet?.auth?.accountName,
                                        permission: wallet?.auth?.permission
                                    }
                                ],
                                data: {
                                    proposer: wallet?.auth?.accountName,
                                    title: title,
                                    summary: summary,
                                    ipfsurl: ipfsUrl,
                                    max_reward: maxRewardNew
                                }
                            }
                        ]
                    },
                    {
                        broadcast: true,
                        blocksBehind: 3,
                        expireSeconds: 60
                    })

                console.log('response ', response)
                addToast('Create Proposal Successful', {appearance: 'success', autoDismiss: true})

            }
        } catch (e) {
            console.log('something went wrong ', e)
            addToast(generateError(e, "Failed to create proposal"), {appearance: 'error', autoDismiss: true})

        } finally {
            setLoading(false)
        }

    }


    const closeModal = () => {
        dispatch(hideCreateProposalModal())
    }


    return (


        <Fragment>
            <div
                className={`modal modal-backdrop modalBlueBg createProposalModal ${selector.modals.createProposalModal ? 'show' : ''} `}
                tabIndex="-1"
                role="dialog">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">

                        <div className="modal-body">

                            <div className="col-md-12 mb-4">
                                <div className="d-flex flex-row mt-3">
                                    <h5 className="connectTokenModalHeading">
                                        Create Proposal
                                    </h5>
                                    <div className="ml-auto mtb-auto">
                                        <button type="button" onClick={closeModal}
                                                className="close text-white pull-right">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <Formik initialValues={createProposalInitialSchema}
                                    validationSchema={createProposalValidationSchema}
                                    onSubmit={handleCreateProposal}>
                                <Form>
                                    <div className="row p-2">


                                        <div className="col-md-12">
                                            <Field type="text" name="title" className="form-control primaryInput"
                                                   placeholder="Proposer Title"/>
                                            <p className="text-danger mt-2 errorInput">
                                                <ErrorMessage name="title"/>
                                            </p>

                                        </div>

                                        <div className="col-md-12 mt-3">
                                            <Field placeholder="Summary" name="summary"
                                                   className="form-control primaryInput"
                                                   component="textarea" rows={5}/>
                                            <p className="text-danger mt-2 errorInput">
                                                <ErrorMessage name="summary"/>
                                            </p>
                                        </div>

                                        <div className="col-md-12 mt-3">
                                            <Field type="text" name="ipfsUrl" className="form-control primaryInput"
                                                   placeholder="External Link"/>
                                            <p className="text-danger mt-2 errorInput">
                                                <ErrorMessage name="ipfsUrl"/>
                                            </p>
                                        </div>


                                        <div className="col-md-8 mt-3">
                                            <Field type="text" name="maxReward" className="form-control primaryInput"
                                                   placeholder="Maximum Reward"/>
                                            <p className="text-danger mt-2 errorInput">
                                                <ErrorMessage name="maxReward"/>
                                            </p>
                                        </div>

                                        <div className="col-md-4 mt-3">
                                            <Field type="text" name="token" className="form-control primaryInput"
                                                   component="select">
                                                <option value="DAPP">DAPP</option>
                                            </Field>
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-center">
                                        <button type="submit" className="btn btnDefaultBlue text-center"
                                                disabled={loading}>

                                            {loading ?
                                                <Loader color={"#fff"} type="Oval" width={40}
                                                        height={45}/> : 'Create Proposal'
                                            }


                                        </button>
                                    </div>


                                </Form>
                            </Formik>

                            <div className="col-md-12">
                                <p className="createProposalText">
                                    Note : Contract charges a fee of 1000 DAPP tokens, Fees will be returned to the user
                                    once
                                    the proposal receives 2% votes out of total supply
                                </p>
                            </div>


                        </div>
                    </div>
                </div>
            </div>
        </Fragment>


    )
}

export default CreateProposalModal
