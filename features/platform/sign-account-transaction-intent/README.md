# @features/platform-sign-account-transaction-intent

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The Device Intent that signs a prepared account transaction, whatever the coin family and the source. Its input is `signSend(prepared)` dispatched; the job runs it on the executor's session and hands the `SignedSend` to `onResult`, for `broadcastSend`.

- States: `pending`, `device-signature-requested`, `device-streaming`, `device-signature-granted`, `signed` (completes), `cancelled` with `retry` on a refusal on the device, `error` (completes) on any other failure, an outdated or expired preparation included: the flow prepares again. The observable never errors.
- Each app binds a component to `signAccountTransactionIntentDefinition`, as for any intent.
