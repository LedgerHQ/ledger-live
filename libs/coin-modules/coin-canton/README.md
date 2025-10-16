# coin-canton

This repository contains the Coin Canton module for Ledger Live.

## Overview

The Coin Canton module provides support for the Canton blockchain within the Ledger Live application

## Protobuf Generation

The Canton module uses Protocol Buffers (protobuf) for communication with the Ledger device. The protobuf definitions are automatically generated from external repositories.

### When to use

When new portobuf applied to [gateway](https://github.com/LedgerHQ/canton-protos-scala) and [app-canton](https://github.com/LedgerHQ/app-canton) use the `generate-proto` script to update TypeScript bindings.

### How to use

```bash
# Navigate to the coin-canton directory
cd libs/coin-modules/coin-canton

# Run the protobuf generation script
pnpm generate-proto
```

### Description

The script performs the following operations:

1. **Downloads proto files** from external repositories:

   - `LedgerHQ/app-canton` (develop branch) - Contains device-specific protobuf definitions
   - `digital-asset/daml` (main branch) - Contains DAML ledger API definitions

2. **Processes proto files** by:

   - Replacing reserved words to ensure C-compatible field names
   - Handling naming conflicts (e.g., `bool bool` → `bool bool_`)

3. **Generates TypeScript bindings** using `protobufjs`:

   - Creates `src/types/transaction-proto.json` with compiled protobuf definitions
   - Uses ES6 modules format for modern JavaScript compatibility

4. **Cleans up** temporary files after generation

### Testing

To test the newly generated bindings, use the `src/common-logic/transaction/split.test.ts` test.

After updating the bindings, don’t forget to also update:

- `/src/test/prepare-transfer.json` — with the updated `token-transfer` request from the [gateway](https://canton-gateway.api.live.ledger-test.com/docs/openapi/redoc/index.html#operation/postV1NodeNode_preset_idPartyParty_idTransactionPrepare)
- `/src/test/prepare-transfer-serialized.json` — with the serialized version generated using [split_tx_util.py](https://github.com/LedgerHQ/app-canton/blob/develop/scripts/split_tx_util.py)
