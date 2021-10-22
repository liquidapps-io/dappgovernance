const initialState = {
    walletConnected: false,
    username: '',
    showSideBar: false,
    userBalance: '0.0000 EOS'
}

const userReducer = (state = initialState, action) => {
    switch (action.type) {
        case "LOGIN":
            return {
                ...state,
                walletConnected: true,
                username: action.username
            }

        case "LOGOUT":
            return {
                ...state,
                walletConnected: false,
                username: '',
                userBalance: '0.0000 EOS'
            }

        case "TOGGLE_SIDEBAR":
            return {
                ...state,
                showSideBar: !state.showSideBar
            }

        case "USER_BALANCE":
            return {
                ...state,
                userBalance: action.balance
            }

        default:
            return state
    }
}

export default userReducer