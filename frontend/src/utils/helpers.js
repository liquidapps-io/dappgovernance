export const generateError = (e, defaultMsg) => {

    try {
        let errorString = JSON.stringify(e)

        if (errorString && errorString.includes('assertion failure with message')) {
            let errorObj = JSON.parse(errorString)

            const msgObj = errorObj?.json?.error?.details[0]?.message

            if (typeof msgObj === 'string' && msgObj.includes(':')) {
                const errorMsg = msgObj.split(':')[1]

                return errorMsg
            }

            return defaultMsg
        }

        return defaultMsg
    } catch {
        return 'Something went wrong'
    }
}