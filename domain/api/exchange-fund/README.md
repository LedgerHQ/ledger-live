# @domain/api-exchange-fund

> [!CAUTION]
> **Status: UNSTABLE** — Part of the emerging DDD layer; under active development.

Domain API client for the **exchange transaction manager**, the Ledger service that brokers a signed
fund payload from the provider. Injects its endpoints into the shared `exchangeFundApi` service
(`@shared/api-services`, `services/exchange-fund`) rather than declaring its own `createApi`.

| Endpoint | Method | Path | Purpose |
| -------- | ------ | ---- | ------- |
| `remitFundCard` | POST | `/exchange/v1/fund/card/remit` | Exchange a device nonce for the payin address and the provider's signed payload |
| `confirmFund` | POST | `/history/webhook/v1/transaction/{quoteId}/accepted` | Report the top-up as broadcast |
| `cancelFund` | POST | `/history/webhook/v1/transaction/{quoteId}/cancelled` | Report the top-up as abandoned |

## Why the payload matters

`remitFundCard` answers with `providerSig`, which the device verifies against the partner key CAL
endorsed before it renders the top-up. That is what lets the device show *"Fund card: 50 USDC"*
rather than an address the user cannot check. Neither `payload` nor `signature` is decoded here — the
device is the only consumer that needs their contents.

`payinAddress` comes back from this call. It is not read from the provider's own API, so the address
the transaction pays and the address inside the signed payload have a single source.

## Order of operations

```
startExchange(device)              → nonce
remitFundCard({ nonce, … })        → payinAddress + providerSig
completeExchange(payload, signature)  device renders and signs
confirmFund({ quoteId })           on broadcast
cancelFund({ quoteId, … })         on refusal or failure
```
