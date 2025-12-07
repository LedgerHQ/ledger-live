# Test Fixtures

This directory contains test fixtures for the Canton hardware app tests.

## Files

- `prepare-transfer.json` - Response from https://canton-gateway.api.live.ledger.com/docs/openapi/redoc/index.html#operation/postV1NodeNode_preset_idPartyParty_idTransactionPrepare
- `prepare-transfer-serialized.json` - Serialized protobuf data in hex format
- `prepare-transfer.apdus` - APDU command sequences recorded with signing `prepare-transfer.json` with device

## Updating `prepare-transfer-serialized.json`

When `prepare-transfer.json` is updated, use it as input for `split_tx_util.py` from https://github.com/LedgerHQ/app-canton/scripts/ to update `prepare-transfer-serialized.json`
