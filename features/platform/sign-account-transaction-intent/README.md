# @features/platform-sign-account-transaction-intent

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The Device Intent that signs a prepared account transaction, whatever the coin family and the source. Its input is `signSend(prepared)` dispatched; the job runs it on the executor's session and hands the `SignedTransaction` to `onResult`.

- States: `pending`, `device-signature-requested`, `device-streaming`, `device-signature-granted`, `signed` (completes), `cancelled` with `retry` on a refusal on the device. Other failures are observable errors.
- Each app binds a component to `signAccountTransactionIntentDefinition`, as for any intent.
