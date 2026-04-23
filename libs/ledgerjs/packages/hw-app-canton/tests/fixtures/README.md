# Test Fixtures

This directory contains test fixtures for the Canton hardware app tests.

## Files

- `prepare-transfer.json` — a sample transaction request (`token-transfer-request`) from the [Gateway API](https://canton-gateway.api.live.ledger-test.com/docs/openapi/redoc/index.html#operation/postV1NodeNode_preset_idPartyParty_idTransactionPrepare)
- `prepare-transfer-serialized.json` — the expected serialized output, generated using [split_tx_util.py](https://github.com/LedgerHQ/app-canton/blob/develop/scripts/split_tx_util.py)
- `prepare-transfer.apdus` - APDU command sequences recorded when signing prepare-transfer reponse
