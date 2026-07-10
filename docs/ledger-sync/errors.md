# User-facing errors

Errors a user can actually **see** during Ledger Sync, and where. Source of truth:
[`libs/ledger-key-ring-protocol/src/errors.ts`](../../libs/ledger-key-ring-protocol/src/errors.ts);
the user-facing copy lives in the apps' i18n and is mapped to UI steps in the WalletSync hooks
(LWD `useQRCode.ts` / `walletSync.hooks.ts`, LWM `useSyncWithQrCode.ts` / `useWatchWalletSync.ts`).

> [!NOTE]
> Conventions:
> - Only errors users can **see** are listed — not unexpected/internal ones (those get a Jira bug).
> - One error documented once, with every place it can surface.

## During sync & instance management

### TrustchainEjected

You are no longer a member — removed by someone else, or the trustchain was destroyed. The
[watch loop](./06-watch-loop.md) catches it and resets the local store automatically; when
managing instances it surfaces as **"Not Synced anymore"**.

### TrustchainNotAllowed

Your JWT carries no permission for the trustchain at the current `applicationPath`. Shown as
**"You are not in sync anymore"** ("Please try again or contact Ledger Support."). Most visible
when trying to **remove a member with the wrong device seed**.

### TrustchainNotFound

The trustchain could not be fetched (e.g. while listing members / managing instances). Shown as
**"Something went wrong while fetching your data"**.

## When adding an instance via the [QR-code flow](./03-qr-code-protocol.md)

### ScannedInvalidQrCode

The scanned code is not a valid Ledger Sync QR code → dedicated error screen.

### ScannedOldImportQrCode

An **old-style account-import** QR was scanned instead of a sync QR → dedicated error screen.

### ScannedNewImportQrCode

A **newer** QR format this app version can't read was scanned. Shown as **"Update required"**
("To sync your apps, please make sure both are updated to the latest version.").

### InvalidDigitsError

The 3-digit code typed does not match the one shown on the other instance (the
[handshake](./03-qr-code-protocol.md#the-handshake) check). Routed to a pin-code error step
(LWD `PinCodeError`, LWM `SyncError`).

### QRCodeWSClosed

The pairing WebSocket closed before completion (timeout / cancellation). LWD automatically
restarts the QR code if it closed after a minimum delay.

### NoTrustchainInitialized

The instance has no trustchain yet to add a member to → "unbacked" error step (`UnbackedError`).

### TrustchainAlreadyInitialized

This instance is already part of a trustchain. Routed to **"already synced"** when it's the same
root, or **"backed with different seeds"** when the roots differ.

### TrustchainAlreadyInitializedWithOtherSeed

Already initialized with a **different seed** → **"backed with different seeds"**.

## Internal errors (not shown to users)

Listed only to clarify they are **handled automatically**, never surfaced:

- **TrustchainOutdated** — the `applicationPath` is behind after a
  [key rotation](./02-trustchain-sdk.md#key-rotation-on-member-removal); recovered by
  `restoreTrustchain` in the watch loop.
- **InvalidEncryptionKeyError** — internal guard; not surfaced in the apps.
