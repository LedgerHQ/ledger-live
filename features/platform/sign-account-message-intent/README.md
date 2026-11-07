# @features/platform-sign-account-message-intent

> [!CAUTION]
> **Status: UNSTABLE.** New package, API still being designed.

The Device Intent that signs a message with an account, whatever the coin family and the source. Its input is `signMessageSend(descriptor, messageHex)` dispatched; the job runs it on the executor's session and hands the signature, in hex, to `onResult`.

- States: `pending`, `device-signature-requested`, `signed` (completes), `cancelled` with `retry` on a refusal on the device. Other failures are observable errors.
- Each app binds a component to `signAccountMessageIntentDefinition`, as for any intent.
