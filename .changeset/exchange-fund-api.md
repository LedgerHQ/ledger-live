---
"@domain/api-exchange-fund": minor
"@shared/api-services": minor
"@shared/env": minor
---

Add the exchange transaction manager client, which brokers the signed payload a card top-up is clear-signed from:

- `remitFundCard` exchanges a device nonce for the payin address and the provider's signed payload.
- `confirmFund` and `cancelFund` close the order out once the transaction is broadcast or refused.
- New `exchangeFundApi` service and an `EXCHANGE_FUND_API_URL` env var, defaulting to the production transaction manager.

No caller yet: the device intent that consumes the payload lands next.
