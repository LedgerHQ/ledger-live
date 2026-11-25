# @shared/storage-electron

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The `StoragePort` adapter of Ledger Wallet Desktop, for persistence
(`@features/platform-persistence`).

`createElectronStorage({ bridge, namespace = "app" })` reads and writes 1 key of the `app`
namespace (`app.json`) through the db bridge of the preload script (`getKey`, `setKey`). The
app injects the bridge: the renderer has no direct access to `electron`. The
adapter never logs a value.

- `encryptedKeys`: the keys that main encrypts with the password (`accounts`). While the app is
  locked, main gives the ciphertext string for such a key. The adapter then throws
  `StorageLockedError`, so persistence never decodes or overwrites the ciphertext.
- `set` resolves when main has the value. Main saves `app.json` after its own 500 ms batch, so a
  write reaches the disk up to 500 ms later. `db.flush()` saves it at once (the quit flush).
