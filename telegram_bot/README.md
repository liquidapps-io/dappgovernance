## Telegram Governance Bot

This bot will allow the user to post messages to 2 channels if you wish.  In our case we have an internal channel where we wish to receive all msigs related to the `dappservices` and `dappgovernor` contracts.  We also have a governance channel which is only posted to if at least the minimum required threshold of signature providers are requested on the msig.  For example, the `dappgovernor@owner` permission requires 11 signatures, thus we check if there are 11 requested signers present on the msig.

You can also adjust the frequency for a keep alive message as well as the frequency of how often to query for new msigs.  I would recommend an hour or more simply because hyperion is provided for free as an API and you will get rate limited if you try and query too often.

Set the below variables to get started:

```
export BOT_TOKEN=
export BOT_CHAT_ID=
export BOT_CHAT_ID_GUARDIANS=
```

If you're having issues getting your bot setup you can try using these queries:

```
// try and setup bot
https://api.telegram.org/BOT_ID_HERE:BOT_PW_HERE/getUpdates

// send a test message
https://api.telegram.org/BOT_ID_HERE:BOT_PW_HERE/sendMessage?chat_id=CHAT_ID_HERE&text=hello%20world
```

### Start Bot

```
node index.js > log.txt
```