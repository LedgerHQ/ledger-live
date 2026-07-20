# @ledgerhq/coin-tester-kaspa

Deterministic integration tester for `@ledgerhq/coin-kaspa`. Validates the sync/craft/sign/broadcast
path against a real local Kaspa node (kaspad + kaspa-rest-server in Docker), without Ledger Live UI,
without real funds, and without external network calls.

## Prerequisites

- Docker and Docker Compose v2
- `pnpm install` at the repo root

## Running

```sh
pnpm coin:tester:kaspa start
```

This spins up kaspad in simnet mode plus a kaspa-rest-server, runs all scenario transactions for both
`legacy` and `generic-adapter` bridge strategies, then tears down the containers.

## Architecture

- `src/signer.ts` — local BIP32/Schnorr signer (no hardware wallet, no Speculos)
- `src/kaspaNode.ts` — Docker lifecycle (spawn/kill/fund/wait)
- `src/fixtures.ts` — constants + MSW stubs for external Ledger services
- `src/helpers.ts` — `getBridges()` for both bridge strategies
- `src/scenarii/kaspa.ts` — scenario: 4 transactions (fixed send, custom fee, multi-UTXO, send-max)
- `docker-compose.yml` — kaspad (simnet) + kaspa-rest-server

## Known UNCERTAIN items (from T02 spec)

- **Docker images**: `kaspanet/rusty-kaspa` and `ghcr.io/kaspa-ng/kaspa-rest-server` tags need
  pinning once verified to match the `api.kaspa.org` response shape coin-kaspa's `network/` layer parses.
- **Sighash encoding**: The BLAKE2B-256 sighash preimage byte order (especially prevTxId endianness)
  and Schnorr variant need verification against a live local node.
- **Simnet mining**: Confirm kaspad simnet flags for fast deterministic block generation and funded
  coinbase.
- **Signer key-derivation path**: BIP44 coin type 111111, confirmed from bridge dataset test.
