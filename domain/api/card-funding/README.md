# @domain/api-card-funding

> [!CAUTION]
> **Status: UNSTABLE** — The Wallet-owned Card Fund flow is under active development.

RTK Query operation for obtaining a provider-signed Card Fund payload.

`requestCardFundPayload` asks Baanx for a payload bound to the device nonce, on the Card session of
`cardApi`, and returns it with its signature in the form the Exchange app expects.

Transport configuration stays in `@shared/api-services`.
