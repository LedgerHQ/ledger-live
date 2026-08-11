# BTC gap-limit live scan harness

Manual harness for PR #20538 (`fix(bitcoin): gap limit handle`). Not part of CI.

## What it proves

Drives the real Bitcoin currency bridge against a live explorer and reports which account indices discovery returns for a given mnemonic and gap limit. The code under test is `makeScanAccounts` in `@ledgerhq/ledger-wallet-framework`. No device and no Speculos: the signer derives xpubs and addresses locally from a mnemonic, matching what a device would return for the same seed.

Use this to validate gap-limit behaviour on mainnet or testnet before or after the PR lands.

## Prerequisites

- `ledger-live` repo with dependencies installed (`pnpm install` at repo root)
- Network access to the Bitcoin explorer (testnet or mainnet)

## Run

From `libs/coin-modules/coin-bitcoin`:

```bash
# Default: BIP39 test vector, bitcoin_testnet, gap 20
pnpm exec jest src/__tests__/gapLimitLive.manual.test.ts

# Custom mnemonic and network
MNEMONIC="<12 words>" CURRENCY=bitcoin_testnet GAP=20 \
  pnpm exec jest src/__tests__/gapLimitLive.manual.test.ts

# Mainnet (use a funded or known mnemonic)
MNEMONIC="<12 words>" CURRENCY=bitcoin GAP=20 \
  pnpm exec jest src/__tests__/gapLimitLive.manual.test.ts
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `MNEMONIC` | BIP39 test vector | 12 or 24 word seed phrase |
| `CURRENCY` | `bitcoin_testnet` | `bitcoin` or `bitcoin_testnet` |
| `GAP` | `20` | Sets `KEYCHAIN_OBSERVABLE_RANGE` for the scan |

## Output

Prints a JSON table of discovered accounts: derivation mode, index, used flag, balance, operation count. Example:

```
GAP=20 bitcoin_testnet
[
  { "derivationMode": "native_segwit", "index": 0, "used": true, "balance": "...", "operations": 3 }
]
```

## Safety

Does not broadcast transactions. Read-only scan against the explorer plus local key derivation.

## Related

- PR #20538: gap limit handle fix
- `libs/ledger-wallet-framework/src/bridge/gapLimitBoundary.manual.test.ts`: mocked boundary cases (no network)
