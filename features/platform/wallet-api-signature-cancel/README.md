# @features/platform-wallet-api-signature-cancel

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The Wallet API `custom.signature.cancel` method: a Live App cancels the sign requests it has not had signed yet, e.g. Wallet Connect when the dApp they were made for disconnects.

## How it works

The Live App tags its `transaction.sign`, `transaction.signAndBroadcast` and `message.sign` requests with a group in their `meta`, under `SIGNATURE_REQUEST_GROUP_META_KEY` (`requestGroupId`), e.g. the Wallet Connect session topic. It then calls `custom.signature.cancel` with `{ requestGroupId }`: the pending requests of that group reject with `SignatureRequestCancelled`, and the call answers `{ cancelled }`, how many of them were shown or queued. A call without a non-empty `requestGroupId` is refused.

- `handlers({ cancelSignatures })` returns the handler to merge into a live app player's custom handlers. The app implements `cancelSignatures(requestGroupId)`, which rejects the requests of the group and returns how many there were.
- `getSignatureRequestGroupId(meta)` reads the group of a sign request from its `meta`, for the Wallet API server to pass it to the app's sign UI.

Only Ledger Wallet Mobile's device-intent sign flow (`llmWalletApiDeviceIntentSign`) exposes the method: the other sign flows cannot cancel a request, so they don't expose it.
