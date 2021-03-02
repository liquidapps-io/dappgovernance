import {Fragment, useEffect, useState} from "react";
import {useHistory} from "react-router-dom";
import EosApi from 'eosjs-api'
import {eosjsEndPoint, ProposerTable} from "../../utils/constants";
import Pagination from "react-js-pagination";
import '../../styles/proposalList.css'
import Loader from "react-loader-spinner";
import {useDispatch} from "react-redux";
import {showCreateProposalModal} from "../../redux/actions/ModalActions";
import CreateProposalModal from "../../components/CreateProposalModal/CreateProposalModal";

const ProposalLists = () => {

    const [proposalLists, setProposalLists] = useState([])
    const [frontendData, setFrontendData] = useState([])
    const history = useHistory()
    const dispatch = useDispatch()
    const [filterText, setFilterText] = useState('')
    const [loading, setLoading] = useState(false)


    const goToLockPage = () => {
        history.push('/lock')
    }

    const goToHomePage = () => {
        history.push('/')
    }


    const [sortByOption] = useState([
        {name: 'All'},
        {name: 'Proposed'},
        {name: 'Accepted'},
        {name: 'Rejected'},
        {name: 'Implemented'},
        {name: 'Expired'},
        {name: 'Implementation-Queue'},
    ])
    const [activePage, setActivePage] = useState(1)
    const [itemPerPage] = useState(10)
    const [dataLength, setDataLength] = useState(0)


    const options = {
        httpEndpoint: eosjsEndPoint
    }

    const eos = EosApi(options)


    const getTableRows = async () => {
        try {
            setLoading(true)
            const tableRows = await eos.getTableRows({
                code: ProposerTable.code,
                table: ProposerTable.table,
                scope: ProposerTable.scope,
                json: 'true',
                limit: 100
            })

            console.log('table rows called', tableRows)
            if (tableRows) {
                console.log(tableRows.rows)
                setProposalLists(tableRows.rows)
            }
            setLoading(false)

        } catch (e) {
            console.log('something went wrong in getting dapp token', e)
            setProposalLists([])
            setLoading(false)
        }
    }

    const goToDetail = (id) => {
        history.push(`/proposal/detail/${id}`)
    }

    const handleFilterClick = (e) => {
        setFilterText(e.target.value)
    }

    const handlePageChange = (page) => {
        setActivePage(page)
    }

    const handleCreateProposal = () => {
        dispatch(showCreateProposalModal())
    }

    const handleSearchInput = (e) => {
        const textString = e.target.value
        const filteredData = proposalLists.filter((filter) => {
            return filter.title.includes(textString)
        })
        setFrontendData(filteredData)
        setDataLength(filteredData.length)
    }

    useEffect(() => {
        getTableRows()
    }, [])

    useEffect(() => {
        setFrontendData(proposalLists)
        setDataLength(proposalLists.length)
    }, [proposalLists])


    useEffect(() => {
        const filteredData = proposalLists.filter((filter) => {
            return filter.status === (filterText ? filterText : filter.status)
        })
        setFrontendData(filteredData)
        setDataLength(filteredData.length)

    }, [filterText])


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
                                <h1 className="mainHeading active">
                                    Governance Proposals
                                </h1>
                                <div className="lineTag"/>
                            </div>
                            <div className="nameWidth" onClick={goToLockPage}>
                                <h1 className="mainHeading">
                                    DAPP tokens
                                </h1>
                            </div>

                            <div className="searchWidth">
                                <div className="searchBlock">
                                    <i className="fa fa-search searchInputIcon"/>
                                    <input type="text" placeholder="Search by proposal name..."
                                           onKeyUp={(e) => handleSearchInput(e)}
                                           className="form-control primaryInput searchInput pl55"/>
                                </div>
                            </div>

                            <div className="filterWidth">
                                <select className="form-control primaryInput plr25 pull-right"
                                        onChange={(e) => handleFilterClick(e)}>
                                    <option disabled={true} value="" selected={true}>Filter By status</option>
                                    {sortByOption.map((sort, index) => {
                                        return (
                                            <Fragment>
                                                <option
                                                    value={(sort.name === 'All' ? '' : sort.name)}>{sort.name}</option>
                                            </Fragment>
                                        )
                                    })
                                    }


                                </select>
                            </div>

                            <div className="btnWidth">
                                <button className="btn primaryButton btnHeader connectBtn pull-right"
                                        onClick={handleCreateProposal}>
                                    Create Proposal
                                </button>
                            </div>
                        </div>


                    </div>

                    <div className="col-md-12 mt-5 mb-5">


                        <div className="row">

                            {proposalLists.length > 0 &&
                            frontendData.slice(activePage === 1 ? 0 : (activePage - 1) * 10, itemPerPage * activePage).map((key, index) => {
                                return (
                                    <Fragment>
                                        <fieldset className="fieldBlock" onClick={() => goToDetail(key.id)}
                                                  key={key.id}>
                                            <legend className={key.status.toLowerCase()}>{key.status}</legend>

                                            <div className="row">
                                                <div className="col-md-2">
                                                    <h6 className="proposalNo">Proposal #{key.id}</h6>
                                                </div>
                                                <div className="col-md-4">
                                                    <h5 className="proposalDate">
                                                        {new Date(key.created_at).toGMTString()}
                                                    </h5>
                                                </div>
                                                <div className="col-md-4">
                                                    <h1 className="proposalName">
                                                        {key.title}
                                                    </h1>
                                                </div>

                                                <div className="col-md-2">
                                                    <h6 className="authorName">
                                                        Author
                                                        <br/> ~ {key.proposer}
                                                    </h6>
                                                </div>

                                            </div>

                                        </fieldset>
                                    </Fragment>
                                )
                            })
                            }

                            {loading &&
                            <div className="col-md-12 text-center mt-5">
                                <Loader color={"#fff"} type="Oval" width={75} height={75}/>
                            </div>
                            }

                        </div>

                    </div>

                    <div className="row">
                        <div className="col-md-12">
                            <div className="pull-right">


                                <Pagination
                                    activePage={activePage}
                                    itemsCountPerPage={itemPerPage}
                                    totalItemsCount={dataLength}
                                    pageRangeDisplayed={30}
                                    onChange={(e) => handlePageChange(e)}
                                    activeClass="active"
                                />


                            </div>
                        </div>
                    </div>


                </div>
            </div>

            <CreateProposalModal/>


        </Fragment>
    )
}

export default ProposalLists