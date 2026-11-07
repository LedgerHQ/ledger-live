# @domain/api-account-transaction

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

Sending from an account through the account data sources. A source that sends adds a `send` capability (`AccountSendCapability`) next to its readers: the same id, rank and purposes serve both.

- `prepareSend(descriptor, request)`: the first ranked source that sends from the account prepares it; `AccountDataNotServedError` hands the account to the next one. Resolves a `PreparedSend` value: the account, the source and the prepared transaction.
- `signSend(prepared)`: `(device) => Observable<TransactionSignEvent>`, for the sign Device Intent job. Only the source that prepared signs.
- `broadcastSend(prepared, signed)`: broadcasts on that source and adds its pending rows to `accountPendingOperations`.

A signature belongs to the value it signed: a new preparation never receives an older signature. See [the account data layer](../../../docs/account-data-layer.md#sending).
