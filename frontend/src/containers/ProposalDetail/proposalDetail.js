import {Fragment, useEffect, useState} from "react";
import VoteProposal from "../../components/VoteProposal/VoteProposal";
import {useHistory} from "react-router-dom";
import {ContractNames, eosjsEndPoint, ProposerMetaTable, ProposerTable} from "../../utils/constants";
import EosApi from "eosjs-api";
import '../../styles/proposalDetail.css'
import {useDispatch} from "react-redux";
import WalletProvider from '../../utils/wallet'
import {showVoteModal} from "../../redux/actions/ModalActions";
import {useToasts} from "react-toast-notifications";
import {generateError} from "../../utils/helpers";

const ProposalDetail = (props) => {

    const [tableData, setTableData] = useState({})
    const [metaData, setMetaData] = useState({})
    const [show, setShow] = useState(false)
    const [loading, setLoading] = useState(false)

    const history = useHistory()

    const dispatch = useDispatch()
    const {addToast} = useToasts()


    const proposalId = props.match.params.proposalId

    console.log('propsal id', proposalId)

    const options = {
        httpEndpoint: eosjsEndPoint
    }

    const eos = EosApi(options)

    const getTableRows = async () => {
        try {

            const tableRows = await eos.getTableRows({
                code: ProposerTable.code,
                table: ProposerTable.table,
                scope: ProposerTable.scope,
                json: 'true',
                limit: 100
            })

            if (tableRows) {

                const finalRows = tableRows.rows

                debugger
                const proposedDataRow = finalRows.filter((key) => {
                    return key.id === parseInt(proposalId)
                })

                console.log('matched data', proposedDataRow)

                if (proposedDataRow.length > 0) {
                    setTableData(proposedDataRow[0])
                }
            }

        } catch (e) {
            console.log('something went wrong in getting dad token', e)
            setTableData({})
        }
    }

    const getTableRowsMeta = async () => {
        try {

            const tableRowsMeta = await eos.getTableRows({
                code: ProposerMetaTable.code,
                table: ProposerMetaTable.table,
                scope: ProposerMetaTable.scope,
                json: 'true',
                limit: 100
            })

            if (tableRowsMeta) {
                const finalRowsMeta = tableRowsMeta.rows

                console.log('meta data all row', finalRowsMeta)
                const metaDataRow = finalRowsMeta.filter((key) => {
                    return key.proposal_id === parseInt(proposalId)
                })

                if (metaDataRow.length > 0) {
                    console.log('meta Data', metaDataRow[0])
                    setMetaData(metaDataRow[0])
                }

            }

        } catch (e) {
            console.log('something went wrong in getting Proposal meta data', e)
        }
    }

    const goToBackPage = () => {
        history.push('/')
    }

    const openVoteModal = () => {
        dispatch(showVoteModal())
    }

    const handleUpdateTally = async () => {
        const { id } = tableData
        try {
            setLoading(true)
            const wallet = WalletProvider.getWallet()

            if (!!wallet) {
                await wallet.eosApi.transact({
                        actions: [
                            {
                                account: ContractNames.dappGovernanceContract,
                                name: 'updatetally',
                                authorization: [
                                    {
                                        actor: wallet?.auth?.accountName,
                                        permission: wallet?.auth?.permission
                                    }
                                ],
                                data: {
                                    proposal_id: id
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
                addToast('Tally Updated', {appearance: 'success', autoDismiss: true})

            }

        } catch (e) {
            console.log('something went wrong ', e)
            addToast( generateError(e,'Something went wrong'), {appearance: 'success', autoDismiss: true})

        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getTableRows()
        getTableRowsMeta()

    }, [])


    return (
        <Fragment>

            <div className="rectangleBox" style={{background: 'url("/images/rectangle.png")'}}/>
            <div className="rectangleBoxSmall" style={{background: 'url("/images/rect-small.png")'}}/>
            <div className="ellBoxSmall" style={{background: 'url("/images/ell-small.png")'}}/>
            <div className="ellBox" style={{background: 'url("/images/ell-big.png")'}}/>
            <div className="rectBig" style={{background: 'url("/images/rect-big.png")'}}/>

            <div className="container-fluid">
                <div className="container90">
                    <div className="col-md-12">

                        <div className="row">
                            <h5 className="navHeading mt-2" onClick={goToBackPage}>
                                <span className="blueTextBold">
                                      <i className="fa fa-angle-left leftIcon mr-3"/>
                                </span>
                                All Proposals
                                <span className="blueTextBold ml-2">/ {tableData.id}</span>
                            </h5>
                        </div>
                        <div className="lineTag mt-3"/>


                        <div className="row">
                            <div className="packageListItem mt-5">
                                <h6 className="proposalNo">
                                    Proposal #{tableData.id}
                                </h6>
                                <h1 className="proposalName">
                                    {tableData.title}
                                </h1>
                                <p className="proposalDesc">
                                    {tableData.summary}
                                </p>

                                <div className="proposalInfo">
                                    <div className="infoBlock">
                                        <h2 className="keyValue">
                                            {tableData.created_at}
                                        </h2>
                                        <h6 className="keyHeading">
                                            Created
                                        </h6>
                                    </div>
                                    <div className="infoBlock">
                                        <h2 className="keyValue">
                                            {tableData.status}
                                        </h2>
                                        <h6 className="keyHeading">
                                            Status
                                        </h6>
                                    </div>
                                    <div className="infoBlock">
                                        <h2 className="keyValue">
                                            {tableData.proposer}
                                        </h2>
                                        <h6 className="keyHeading">
                                            Author
                                        </h6>
                                    </div>
                                </div>

                                <div className="proposalProgress">

                                    <div className="progressSingle">
                                        <h2 className="keyValue mb-4">
                                            Vote :
                                            <span className="blueText mr-3">
                                            10%
                                        </span>
                                            ( Approved )
                                        </h2>
                                        <div className="progress mb-3">
                                            <div className="progress-bar" role="progressbar" aria-valuenow="70"
                                                 aria-valuemin="0" aria-valuemax="100" style={{width: "70%"}}>
                                                <span className="sr-only">70% Complete</span>
                                            </div>
                                        </div>
                                        <h6 className="keyHeading mt-4">
                                            Percent threshold tracker
                                        </h6>
                                    </div>

                                    <div className="progressSingle timerMain">

                                        <ul className="timerStartBlock">
                                            <li>
                                                <span className="timer">
                                                    25
                                                    <span className="timerSeprate">:</span>
                                                </span>

                                                <span className="timerText">
                                                    DAYS
                                                </span>
                                            </li>

                                            <li>
                                                <span className="timer">
                                                    25
                                                    <span className="timerSeprate">:</span>
                                                </span>

                                                <span className="timerText">
                                                    HOURS
                                                </span>
                                            </li>

                                            <li>
                                                <span className="timer">
                                                    25
                                                    <span className="timerSeprate">:</span>
                                                </span>

                                                <span className="timerText">
                                                    MINUTES
                                                </span>
                                            </li>

                                            <li>
                                                <span className="timer">
                                                    25
                                                </span>
                                                <span className="timerText">
                                                    SECONDS
                                                </span>
                                            </li>
                                        </ul>

                                        <h6 className="keyHeading">
                                            Time Left
                                        </h6>

                                    </div>


                                </div>

                                <div className="col-md-12 mt-5">
                                    <div className="row btnBlock">

                                        <button className="btn outlineBtn voteBtn mr-5" onClick={handleUpdateTally}>
                                            UPDATE TALLY
                                        </button>

                                        <button className="btn primaryButton voteBtn" onClick={openVoteModal}>
                                            VOTE
                                        </button>
                                    </div>
                                </div>

                            </div>

                            <div className="packageListItem mt-5 mb-5">
                                <h2 className="metaHeading">
                                    MetaData
                                </h2>

                                <div className="metaInfo">
                                    <div className="infoBlock">
                                        <h2 className="keyValue">
                                            {metaData.total_votes}
                                        </h2>
                                        <h6 className="keyHeading">
                                            Total Votes
                                        </h6>
                                    </div>
                                    <div className="infoBlock">
                                        <h2 className="keyValue">
                                            {metaData.vote_yes}
                                            <span className="blueText">
                                            ( 10% )
                                            </span>
                                        </h2>
                                        <h6 className="keyHeading">
                                            Total for votes
                                        </h6>
                                    </div>
                                    <div className="infoBlock">
                                        <h2 className="keyValue">
                                            {metaData.vote_no}
                                            <span className="blueText">
                                            ( 10% )
                                            </span>
                                        </h2>
                                        <h6 className="keyHeading">
                                            Total against votes
                                        </h6>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <VoteProposal/>

        </Fragment>
    )
}

export default ProposalDetail