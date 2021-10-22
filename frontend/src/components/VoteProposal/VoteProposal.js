import {Fragment, useEffect, useState} from "react";
import {useDispatch, useSelector} from 'react-redux'
import WalletProvider from "../../utils/wallet";
import {GetVoteStatus, VoteTable} from "../../utils/constants";
import {hideVoteModal, showConnectModal} from "../../redux/actions/ModalActions";
import Loader from "react-loader-spinner";
import {useToasts} from "react-toast-notifications";
import {generateError} from "../../utils/helpers";

const VoteProposal = (props) => {

    const dispatch = useDispatch()
    const voteModalState = useSelector(state => state.modals.voteModal)
    const {addToast} = useToasts()

    const [voteLoading, setVoteLoading] = useState(false)
    const [voteIndex, setVoteIndex] = useState(0)
    const [activeIndex, setActiveIndex] = useState(3) // 0 ,1 ,2 is in use

    const handleVoteClick = async (voteSide) => {
        try {
            console.log('vote clicked')
            setVoteIndex(voteSide)
            setVoteLoading(true)
            const wallet = WalletProvider.getWallet()

            if (!!wallet) {

                const response = await wallet.eosApi.transact({
                        actions: [
                            {
                                account: VoteTable.account,
                                name: VoteTable.name,
                                authorization: [
                                    {
                                        actor: wallet?.auth?.accountName,
                                        permission: wallet?.auth?.permission
                                    }
                                ],
                                data: {
                                    voter: wallet?.auth?.accountName,
                                    proposal_id: props.proposalId,
                                    vote_side: voteSide
                                }
                            }
                        ]
                    },
                    {
                        broadcast: true,
                        blocksBehind: 3,
                        expireSeconds: 60
                    })

                addToast('Vote Successful', {appearance: 'success', autoDismiss: true})
                getVoteCondition() // calling change of get vote conditions
            } else {
                dispatch(hideVoteModal())
                dispatch(showConnectModal())
            }
        } catch (e) {
            console.log('something went wrong ', e)
            addToast(generateError(e, 'Voting Failed'), {appearance: 'error', autoDismiss: true})

        } finally {
            setVoteLoading(false)
        }

    }

    const getVoteCondition = async () => {
        try {

            const wallet = WalletProvider.getWallet()

            if (!!wallet) {

                const voteRows = await wallet.eosApi.rpc.get_table_rows({
                    code: GetVoteStatus.code,
                    table: GetVoteStatus.table,
                    scope: props.proposalId,
                })

                if (voteRows) {
                    const finalVoteRows = voteRows.rows
                    const voteFilterRow = finalVoteRows.filter((key) => {
                        return key.voter == wallet?.auth?.accountName
                    })
                    console.log('user vote', voteFilterRow)

                    if (voteFilterRow.length > 0) {
                        setActiveIndex(voteFilterRow[0].vote_side)
                    }

                }
            }

        } catch (e) {
            console.log('vote rows not found', e)
        }
    }

    const closeVoteModal = () => {
        dispatch(hideVoteModal())
    }

    useEffect(() => {
        getVoteCondition()
    }, [])


    return (
        <Fragment>
            <div className={`modal modal-backdrop modalBlueBg voteProposalModal ${voteModalState ? 'show' : ''}`}
                 role="dialog">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">

                        <div className="modal-body">

                            <div className="col-md-12">
                                <div className="row">
                                    <div className="col-md-10 text-center">
                                        <h5 className="modal-heading">
                                            PLEASE SELECT VOTE
                                        </h5>
                                    </div>

                                    <div className="col-md-2">
                                        <button type="button" onClick={closeVoteModal}
                                                className="close text-white">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>

                                </div>
                            </div>

                            <div className="voteBlock">
                                <div className="singleVoteBlock" onClick={() => handleVoteClick(1)}>
                                    <div className={`voteImageBlock ${activeIndex === 1 ? 'active' : ''}`}>
                                        <img src="/images/Yes.svg" alt="vote" className="voteIconImage"/>
                                    </div>
                                    <h5 className="voteText">
                                        YES
                                        {voteLoading && voteIndex === 1 &&
                                        <div className="loaderConnect">
                                            <Loader color={"#fff"} type="Oval" width={40} height={45}/>
                                        </div>
                                        }
                                    </h5>
                                </div>


                                <div className="singleVoteBlock" onClick={() => handleVoteClick(0)}>
                                    <div className={`voteImageBlock ${activeIndex === 0 ? 'active' : ''}`}>
                                        <img src="/images/No.svg" alt="vote" className="voteIconImage"/>
                                    </div>
                                    <h5 className="voteText">
                                        NO
                                        {voteLoading && voteIndex === 0 &&
                                        <div className="loaderConnect">
                                            <Loader color={"#fff"} type="Oval" width={40} height={45}/>
                                        </div>
                                        }
                                    </h5>
                                </div>


                                <div className="singleVoteBlock" onClick={() => handleVoteClick(2)}>
                                    <div className={`voteImageBlock ${activeIndex === 2 ? 'active' : ''}`}>
                                        <img src="/images/Not_sure.svg" alt="vote" className="voteIconImage"/>
                                    </div>
                                    <h5 className="voteText">
                                        NOT SURE
                                        {voteLoading && voteIndex === 2 &&
                                        <div className="loaderConnect">
                                            <Loader color={"#fff"} type="Oval" width={40} height={45}/>
                                        </div>
                                        }
                                    </h5>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}

export default VoteProposal