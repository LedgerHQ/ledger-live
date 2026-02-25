# @ledgerhq/psbtv2

Partially Signed Bitcoin Transaction version 2 (PSBT v2) implementation following BIP370 and BIP174.

## Overview

This package provides a TypeScript implementation of PSBT v2, which is a data structure that carries all relevant information about a Bitcoin transaction through all stages of the signing process - from constructing an unsigned transaction to extracting the final serialized transaction ready for broadcast.

## Features

- Full PSBT v2 support (BIP370)
- Backward compatible with PSBT v0 (BIP174)
- Support for various address types:
  - P2PKH (Legacy)
  - P2WPKH-in-P2SH (Nested SegWit)
  - P2WPKH (Native SegWit)
  - P2TR (Taproot key path spending)

## Usage

```typescript
import { PsbtV2 } from "@ledgerhq/psbtv2";

// Create a new PSBT
const psbt = new PsbtV2();

// Deserialize from buffer
psbt.deserialize(psbtBuffer);

// Convert from PSBT v0 to v2
const psbtV0Buffer = Buffer.from("cHNidP8BAH...", "base64");
const psbtV2 = PsbtV2.fromV0(psbtV0Buffer);

// Allow transaction version 1 (version 2 is recommended per BIP68)
const psbtV2WithV1 = PsbtV2.fromV0(psbtV0Buffer, true);

// Access global fields
const version = psbt.getGlobalTxVersion();
const inputCount = psbt.getGlobalInputCount();
const outputCount = psbt.getGlobalOutputCount();

// Access input fields
const previousTxid = psbt.getInputPreviousTxid(0);
const outputIndex = psbt.getInputOutputIndex(0);

// Access output fields
const amount = psbt.getOutputAmount(0);
const script = psbt.getOutputScript(0);

// Serialize back to buffer
const serialized = psbt.serialize();
```

## API

### Global Fields

- Transaction version
- Fallback locktime
- Input count
- Output count
- TX modifiable flags
- PSBT version

### Input Fields

- Non-witness UTXO
- Witness UTXO
- Partial signatures
- Sighash type
- Redeem script
- BIP32 derivation paths
- Final scriptsig
- Final scriptwitness
- Previous transaction ID
- Output index
- Sequence
- Taproot key signatures
- Taproot BIP32 derivation

### Output Fields

- Redeem script
- BIP32 derivation paths
- Amount
- Script pubkey
- Taproot BIP32 derivation

## License

Apache-2.0
