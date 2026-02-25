# @ledgerhq/concordium-core

Shared Concordium protocol types, serialization, and utilities used by both `@ledgerhq/hw-app-concordium` and `@ledgerhq/coin-concordium`.

## Purpose

This package extracts shared protocol-level logic so that the hardware wallet app and the coin module can depend on it independently, without the coin module depending on the hardware wallet app.

```
hw-app-concordium ←── @ledgerhq/concordium-core ──→ coin-concordium
```

## Exported APIs

### Types (`src/types.ts`)

- `SchemeId` — Ed25519 cryptographic scheme identifier
- `TransactionType` — Transaction type discriminators (Transfer, TransferWithMemo)
- `Transaction` — Transaction structure for signing
- `TransferPayload` — Simple transfer payload
- `TransferWithMemoPayload` — Transfer with memo payload
- `TransactionPayload` — Union of transfer payload types
- `CredentialDeploymentTransaction` — Credential deployment in hw-app format
- `IdOwnershipProofs` — ID ownership proofs from Concordium ID App
- `Address` — Address response from device
- `VerifyAddressResponse` — Verify address response from device
- `SigningResult` — Signing result with signature and serialized transaction

### Address (`src/address.ts`)

- `AccountAddress` — Concordium account address with Base58 ↔ Buffer conversion
  - `AccountAddress.fromBase58(address: string): AccountAddress` — Parse Base58Check address
  - `AccountAddress.isValid(address: string): boolean` — Check if a string is a valid Concordium address
  - `toBase58(): string` — Convert to Base58Check string
  - `toBuffer(): Buffer` — Get raw 32-byte address buffer

### CBOR (`src/cbor.ts`)

- `encodeMemoToCbor(memo: string): Buffer` — Encode memo string to CBOR text string
- `memoEncodedSize(memo: string): number` — CBOR-encoded byte length without allocating (useful for size checks before encoding)
- `decodeMemoFromCbor(cborEncoded: Buffer): string` — Decode CBOR-encoded memo
- `MAX_MEMO_LENGTH` — Maximum memo length before CBOR encoding (254 bytes)
- `MAX_CBOR_SIZE` — Maximum CBOR-encoded memo size (256 bytes)

### Utils (`src/utils.ts`)

- `encodeWord8/16/32/64` — Encode integers to Buffer (big/little endian)
- `decodeWord16/32/64` — Decode integers from Buffer
- `encodeWord8FromString` — Encode a string-represented number as Word8
- `serializeMap` — Serialize a Record to binary format
- `serializeVerifyKey` — Serialize a public key with scheme prefix
- `serializeYearMonth` — Serialize YYYYMM date string
- `serializePath` — Serialize BIP32 path array to Buffer
- `pathToBuffer` — Convert BIP32 path string to device-compatible Buffer
- `chunkBuffer` — Split a buffer into fixed-size chunks

### Serialization (`src/serialization.ts`)

- `serializeTransfer(tx): Buffer` — Serialize a Transfer transaction
- `serializeTransferWithMemo(tx): Buffer` — Serialize a TransferWithMemo transaction
- `serializeTransaction(tx): Buffer` — Serialize any supported transaction type
- `deserializeTransfer(buffer): Transaction` — Deserialize Transfer from buffer
- `deserializeTransferWithMemo(buffer): Transaction` — Deserialize TransferWithMemo from buffer
- `deserializeTransaction(buffer): Transaction` — Deserialize any transaction by auto-detecting type
- `getTransactionType(buffer): TransactionType` — Get transaction type from serialized buffer
- `serializeCredentialDeploymentValues(payload): Buffer` — Serialize credential deployment values
- `serializeIdOwnershipProofs(proofs): Buffer` — Serialize ID ownership proofs
- `serializeAccountOwnershipProofs(signatures): Buffer` — Serialize account ownership proofs
- `insertAccountOwnershipProofs(idProofs, accountSig): string` — Combine ID + account proofs

## Related Packages

- `@ledgerhq/hw-app-concordium` — Ledger device communication for Concordium (depends on this package for shared types/serialization; adds APDU-specific functions)
- `@ledgerhq/coin-concordium` — Ledger Live coin module for Concordium (depends on this package for shared types/serialization)
