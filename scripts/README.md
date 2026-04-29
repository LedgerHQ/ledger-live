# scripts/

Utility scripts for the Ledger Live monorepo. All commands are run from the **repo root**.

---

## `test-family.mjs` — Run all tests for a coin family

```bash
pnpm test:family <family>
```

### What it does

Runs the complete test suite for a given coin/bridge family in one shot. For a family like `evm` this covers:

| Layer | What runs |
|---|---|
| Coin module | `@ledgerhq/coin-evm` (jest) |
| Signer | `@ledgerhq/live-signer-evm` (jest) |
| Tools | `@ledgerhq/evm-tools` (jest) |
| Integration tester | `@ledgerhq/coin-tester-evm` (jest via `start`, needs Docker/Anvil) |
| Bridge logic in live-common | `src/bridge/generic-alpaca/families/evm/` |
| Family logic in live-common | `src/families/evm/bridge.integration.test.ts`, `signer.test.ts`, … |
| Family UI in live-common | `src/families/evm/react.test.ts`, `platformAdapter.test.ts`, `walletApiAdapter.test.ts`, … |

Everything is **auto-discovered** at runtime — no static config to maintain.

### How discovery works

1. **Workspace packages** — scans all monorepo workspace roots and keeps every package whose `name` field contains the family name at a word boundary (so `ton` finds `@ledgerhq/coin-ton` but not `@ledgerhq/coin-canton`).

2. **live-common family tests** — checks for `src/families/<family>/` and `src/bridge/generic-alpaca/families/<family>/` inside `@ledgerhq/live-common` and runs jest scoped to those paths only.

3. **Logic vs UI split** — tests inside `src/families/<family>/` are classified automatically:
   - **UI**: files matching `react`, `platformAdapter`, `walletApiAdapter`, `banner`
   - **Logic**: everything else

### Output

All test output is streamed live to the terminal. At the end a summary is printed:

```
══════════════════════════════════════════════════════════════════════
  TEST SUMMARY
══════════════════════════════════════════════════════════════════════

  Logic Tests:
    ✓ PASS  @ledgerhq/evm-tools
    ✓ PASS  @ledgerhq/live-signer-evm
    ✗ FAIL  @ledgerhq/coin-evm
    ✓ PASS  @ledgerhq/coin-tester-evm
    ✓ PASS  live-common: bridge/generic-alpaca/families/evm
    ✓ PASS  live-common: families/evm (logic)
    ─────────────────────────────────────────────
    5 passed, 1 failed

  UI Tests:
    ✓ PASS  live-common: families/evm (ui)
    ─────────────────────────────────────────────
    1 passed, 0 failed

══════════════════════════════════════════════════════════════════════
  Overall: ✗ FAIL  6 passed, 1 failed  (counts are green/red in terminal)
══════════════════════════════════════════════════════════════════════

══════════════════════════════════════════════════════════════════════
  FAILURE DETAILS
══════════════════════════════════════════════════════════════════════

✗ @ledgerhq/coin-evm
  ───────────────────────────────────────────────────────────────────
  ● EVM bridge › should sign transaction

    Expected: "0xabc"
    Received: undefined

      12 | const result = await bridge.sign(tx)
    > 13 | expect(result).toBe('0xabc')
         |               ^
```

### coin-tester-* packages

`coin-tester-*` packages run deterministic integration scenarios that require Docker infrastructure (Anvil for EVM, Agave for Solana, Atlas for Bitcoin, Chopsticks for Polkadot…). Make sure the relevant `docker-compose` is running before calling `test:family`, otherwise the tests will hang waiting for the network.

```bash
# Example for EVM
cd libs/coin-tester-modules/coin-tester-evm
docker-compose up -d
cd ../../..
pnpm test:family evm
```

### Examples

```bash
pnpm test:family evm
pnpm test:family bitcoin
pnpm test:family solana
pnpm test:family polkadot
pnpm test:family cosmos
pnpm test:family internet_computer     # note: underscore, not hyphen
pnpm test:family zcash-shielded
```

### All supported families

Any folder under `libs/coin-modules/` is a valid family name (strip the `coin-` prefix):

`aleo` · `algorand` · `aptos` · `bitcoin` · `canton` · `cardano` · `casper` · `celo` · `concordium` · `cosmos` · `evm` · `filecoin` · `hedera` · `icon` · `internet_computer` · `kaspa` · `mina` · `multiversx` · `near` · `polkadot` · `solana` · `stacks` · `stellar` · `sui` · `tezos` · `ton` · `tron` · `vechain` · `zcash-shielded`

---

## `coin-coverage-report.mjs` — Coverage summary across coin modules

```bash
pnpm coin:coverage && node scripts/coin-coverage-report.mjs
# or
pnpm coin:coverage:report
```

Reads `coverage-final.json` from each package under `libs/coin-modules/` and prints a table with statement, branch, function, and line coverage percentages.

---

## `coin-features-report.mjs` — Feature support matrix

```bash
node scripts/coin-features-report.mjs
```

Reports which optional features (staking, NFTs, token support, etc.) each coin module implements.
