export const login = ({username}) => {
    return {
        type: 'LOGIN',
        username
    }
}

export const logout = () => {
    return {
        type: 'LOGOUT'
    }
}

export const toggleSideBar = () => {
    return {
        type: 'TOGGLE_SIDEBAR'
    }
}

export const userBalance = ({balance}) => {
    return {
        type: 'USER_BALANCE',
        balance
    }
}