import {combineReducers} from 'redux'
import userReducer from './userReducer'
import modalsReducer from "./modalReducer";

const rootReducer = combineReducers({
    user: userReducer,
    modals: modalsReducer
})

export default rootReducer