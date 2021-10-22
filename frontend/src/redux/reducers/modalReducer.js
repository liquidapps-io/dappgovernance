const initialState = {
    connectTokenModal: false,
    voteModal: false,
    createProposalModal: false
}

const modalsReducer = (state = initialState, action) => {
    switch (action.type) {
        case "SHOW_LOGIN_MODAL":
            return {
                ...state,
                connectTokenModal: true,
            }

        case "HIDE_LOGIN_MODAL":
            return {
                ...state,
                connectTokenModal: false,
            }

        case "SHOW_VOTE_MODAL":
            return {
                ...state,
                voteModal: true,
            }
        case "HIDE_VOTE_MODAL":
            return {
                ...state,
                voteModal: false,
            }
        case "SHOW_CREATE_PROPOSAL_MODAL":
            return {
                ...state,
                createProposalModal: true,
            }
        case "HIDE_CREATE_PROPOSAL_MODAL":
            return {
                ...state,
                createProposalModal: false,
            }
        default:
            return state
    }
}

export default modalsReducer