# @domain/api-card-funding

> [!CAUTION]
> **Status: UNSTABLE** — The Wallet-owned Card Fund flow is under active development.

RTK Query operations for obtaining a provider-signed Card Fund payload.

`requestCardFundPayload` asks Baanx directly for the payload, on the Card session of `cardApi`. The
remit, confirmation, and cancellation operations on the Exchange Transaction Manager need a provider
order id that a native flow does not have, and are not used by the apps.

Transport configuration stays in `@shared/api-services`.
