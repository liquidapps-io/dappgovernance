### Refund Handler

This repo processes pending refunds based on the Hyperion API.  It doesn't work very well at the moment because the API's `present=true` parameter does not work yet.  Once it does, it will only return currently existing rows versus all recent rows.

This script fetches recent delta changes in the `dappservices` `refunds` table, checks if the row still exists, if it does it checks the expiration date, if the amount can be refund, the `refundto` action is called.

Otherwise the entry is stored for later processing.