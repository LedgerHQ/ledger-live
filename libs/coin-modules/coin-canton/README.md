# coin-canton

This repository contains the Coin Canton module for Ledger Live.

## Overview

The Coin Canton module provides support for the Canton blockchain within the Ledger Live application

## Test setup

Create .env.integ.test file based on .env.integ.test.example

## Protobuf Integration

The Canton module uses a binary protocol for all communication between Ledger Live and Ledger hardware devices.
It leverages Protocol Buffers (protobuf) to split complex DAML data structures into a compact binary format that the device can process efficiently.
Compared to JSON, this binary format significantly reduces data transfer size and processing time while preserving type safety and data integrity.
Get more info: [APDU](https://github.com/LedgerHQ/app-canton/blob/develop/doc/APDU.md), [SPLIT_TRANSACTION](https://github.com/LedgerHQ/app-canton/blob/develop/doc/SPLIT_TRANSACTION.md)

### When to Use

After updating protobuf definitions in:

- [gateway](https://github.com/LedgerHQ/canton-protos-scala)
- [app-canton](https://github.com/LedgerHQ/app-canton)

you must regenerate the TypeScript bindings.

```bash
cd libs/coin-modules/coin-canton
pnpm generate-proto
```

### Protobuf Generation Process

The generate-proto script temporary downloads `.proto` files and processes them, fix reserved words and naming conflicts, and then generates TypeScript bindings using protobufjs.

The compiled definitions are saved to `src/types/transaction-proto.json` in ES6 format.

### Key Protobuf Files

#### Core Device Communication

- **`device.proto`** - Primary device communication protocol
  - Defines the main interface for Ledger device communication
  - Contains message types for transaction signing and address derivation
  - Handles device-specific operations and responses

#### DAML Value System

- **`value.proto`** - DAML value types and structures

  - Defines all DAML data types (Unit, Bool, Int64, Date, Timestamp, Numeric, Party, Text, ContractId, Optional, List, TextMap, GenMap, Record, Variant, Enum)
  - Handles DAML's type system for smart contract data

- **`value_cb.proto`** - Canton Bridge value types
  - Canton-specific extensions to DAML value types
  - Additional types for Canton's privacy-preserving features
  - Bridge-specific data structures and metadata

#### Interactive Transaction Submission

- **`interactive_submission_common_data.proto`** - Common submission data structures and metadata
- **`interactive_submission_data.proto`** - Transaction submission structure with versioning
- **`interactive_submission_data_cb.proto`** - Canton Bridge extensions for consensus mechanism

#### Google Protobuf Standard Types

Standard Google protobuf files providing basic types for message containers, time handling, error reporting, and gRPC status codes used throughout the Canton module.

### Testing

To verify the protobuf bindings, run the transaction splitting tests:

```bash
pnpm test src/common-logic/transaction/split.test.ts
```

These tests validate protobuf serialization, and the logic that splits DAML transactions into device-compatible components.

Test data is stored in two files:

- `src/test/prepare-transfer.json` — a sample transaction request (`token-transfer-request`) from the [Gateway API](https://canton-gateway.api.live.ledger-test.com/docs/openapi/redoc/index.html#operation/postV1NodeNode_preset_idPartyParty_idTransactionPrepare)
- `src/test/prepare-transfer-serialized.json` — the expected serialized output, generated using [split_tx_util.py](https://github.com/LedgerHQ/app-canton/blob/develop/scripts/split_tx_util.py)

After updating protobuf bindings, make sure both files are refreshed with the latest Gateway data and serialized output.
