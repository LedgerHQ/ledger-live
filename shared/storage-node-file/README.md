# @shared/storage-node-file

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The `StoragePort` adapter for Node tools that read or write the `app.json` file of Ledger Wallet
Desktop: `apps/cli` (`liveData`, `scan --appjsonFile`) and the e2e tools of
`@ledgerhq/live-e2e-shared`. With it, these tools use the same record definitions as the desktop
app, so they cannot write a shape that the app does not read.

`createNodeFileStorage({ filePath, encryptedKeys = [] })`:

- Reads and writes 1 key under `data` of the file. It keeps the other keys and the other top-level
  fields.
- A missing file reads as `undefined`. The first write creates `{ "data": { … } }`.
- A string value for a key in `encryptedKeys` throws `StorageLockedError` on read and write: the
  tools cannot decrypt a file with a password, and they never replace its ciphertext.
- Writes go in call order, through a temporary file and a rename. The JSON is compact, as the
  desktop app writes it.

The adapter does not watch the file. Do not use it on a file that the desktop app has open.
