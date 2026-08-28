# @ledgerhq/concordium-core

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Shared Concordium protocol types, serialization, and utilities used by `@ledgerhq/coin-concordium` and `@ledgerhq/live-signer-concordium`.

## Purpose

This package extracts shared protocol-level logic so that the coin module and the device signer can depend on it independently.

```
live-signer-concordium ←── @ledgerhq/concordium-core ──→ coin-concordium
```

## Exported APIs

### Types (`src/types.ts`)

- `SchemeId` — Ed25519 cryptographic scheme identifier
- `TransactionType` — Transaction type discriminators (Transfer, TransferWithMemo, TokenUpdate)
- `Transaction` — CCD transaction structure for signing
- `TransactionHeader` — Account transaction header, common to every type
- `TransferPayload` — Simple transfer payload
- `TransferWithMemoPayload` — Transfer with memo payload
- `TransactionPayload` — Union of CCD transfer payload types
- `TokenUpdatePayload` — PLT payload: token id plus a CBOR operations blob
- `TokenUpdateTransaction` — PLT transaction structure for signing
- `AnyTransaction` — `Transaction | TokenUpdateTransaction`
- `CredentialDeploymentTransaction` — Credential deployment in device format
- `IdOwnershipProofs` — ID ownership proofs from Concordium ID App
- `Address` — Address response from device
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
- `MAX_CBOR_SIZE` — Maximum CBOR-encoded CCD memo size (256 bytes)
- `PLT_CBOR_MAX_SIZE` — Maximum PLT operations blob (512 bytes)
- `PLT_TOKEN_ID_MIN_LENGTH` / `PLT_TOKEN_ID_MAX_LENGTH` — Token id bounds (1..128 bytes)

Generic CBOR primitives, added for PLT payloads. Each emits the shortest head, so
output is deterministic:

- `encodeCborUnsigned` / `encodeCborNegative` / `encodeCborInteger`
- `encodeCborByteString` / `encodeCborTextString`
- `encodeCborArray` / `encodeCborMap`
- `encodeCborMapDeterministic` — map with keys in bytewise order of their encoding, matching the chain's own encoder
- `encodeCborTag`

### PLT (`src/plt.ts`)

CIS-7 Protocol-Level Token payload encoding. Output must satisfy both the chain,
which defines the canonical wire format, and the Ledger device, which is stricter
in places; the tighter bound wins.

- `PltTransfer` — A PLT transfer in wallet terms: recipient, amount, decimals, optional memo
- `encodePltTransferOperations(transfer): Buffer` — The CBOR operations blob, `array(1) [ map(1) { "transfer": … } ]`
- `encodePltAmount(amount, decimals): Buffer` — `tag 4([-decimals, amount])`
- `encodePltAddress(address, includeCoinInfo?): Buffer` — `tag 40307({? 1: tag 40305({1: 919}), 3: bstr(32)})`
- `encodePltMemo(memo, tagged?): Buffer` — Bare byte string, or wrapped in tag 24

> [!IMPORTANT]
> A PLT memo is **bytes**, not text. Do not use `encodeMemoToCbor`, which is the
> CCD memo helper and emits a CBOR text string.

### Utils (`src/utils.ts`)

- `encodeWord8/16/32/64` — Encode integers to Buffer (big/little endian)
- `decodeWord16/32/64` — Decode integers from Buffer
- `encodeWord8FromString` — Encode a string-represented number as Word8
- `serializeMap` — Serialize a Record to binary format
- `serializeVerifyKey` — Serialize a public key with scheme prefix
- `serializeYearMonth` — Serialize YYYYMM date string

### Serialization (`src/serialization.ts`)

- `serializeTransfer(tx): Buffer` — Serialize a Transfer transaction
- `serializeTransferWithMemo(tx): Buffer` — Serialize a TransferWithMemo transaction
- `serializeTokenUpdate(tx): Buffer` — Serialize a TokenUpdate (PLT) transaction
- `deserializeTokenUpdate(buffer): TokenUpdateTransaction` — Decode a TokenUpdate transaction; `operations` stays CBOR-encoded
- `isTokenUpdateTransaction(tx): boolean` — Type guard narrowing `AnyTransaction` to the PLT shape
- `serializeTransaction(tx): Buffer` — Serialize any supported transaction type

The TokenUpdate wire layout is the flat transaction the chain accepts and the
device hashes; the signer re-splits it into APDU frames:

```
[header:60][type:1 = 0x1B][token_id_length:1][token_id:N][cbor_length:4 BE][cbor:M]
```

`deserializeTransaction` handles CCD types only. Production never decodes a PLT
payload — history comes from the wallet proxy as JSON — so it directs PLT callers
to `deserializeTokenUpdate`.
- `deserializeTransfer(buffer): Transaction` — Deserialize Transfer from buffer
- `deserializeTransferWithMemo(buffer): Transaction` — Deserialize TransferWithMemo from buffer
- `deserializeTransaction(buffer): Transaction` — Deserialize any transaction by auto-detecting type
- `getTransactionType(buffer): TransactionType` — Get transaction type from serialized buffer
- `serializeCredentialDeploymentValues(payload): Buffer` — Serialize credential deployment values
- `serializeIdOwnershipProofs(proofs): Buffer` — Serialize ID ownership proofs
- `serializeAccountOwnershipProofs(signatures): Buffer` — Serialize account ownership proofs
- `insertAccountOwnershipProofs(idProofs, accountSig): string` — Combine ID + account proofs

## Related Packages

- `@ledgerhq/coin-concordium` — Ledger Live coin module for Concordium (depends on this package for shared types/serialization)
- `@ledgerhq/live-signer-concordium` — Ledger Live signer for Concordium over the Device Management Kit (depends on this package for shared types/serialization)
