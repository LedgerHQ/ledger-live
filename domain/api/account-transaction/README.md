# @domain/api-account-transaction

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

Sending from an account through the account data sources. A source that sends adds a `send` capability (`AccountSendCapability`) next to its readers: the same id, rank and purposes serve both.

- `prepareSend(descriptor, request)`: the first ranked source that sends from the account prepares it; `AccountDataNotServedError` hands the account to the next one. Resolves a `PreparedSend` value with a unique `id`, the account, the source and the prepared transaction.
- `estimateSendFees(descriptor, request, strategies)`: each fee preset's cost, for a fee picker. Empty when the source cannot estimate them apart.
- `signSend(prepared)`: `(device) => Observable<SendSignEvent>`, for the sign Device Intent job. Only the source that prepared signs, and the `SignedSend` it ends with carries the preparation id, account and source.
- `broadcastSend(prepared, signed)`: rejects a `SignedSend` of another preparation with `SignatureMismatchError`, broadcasts on the source that prepared and adds its pending rows to `accountPendingOperations`.
- `releaseSend(prepared)`: frees what the source holds for a preparation the flow abandons or replaces.

See [the account data layer](../../../docs/account-models/data-layer.md#sending).
