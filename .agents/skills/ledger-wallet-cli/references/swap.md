# Swap: quote, execute, status

A swap runs in three steps: `swap quote` (no device), `swap execute` (signs on the device), `swap status` (reads the partner API). Exact flags: `pnpm --silent wallet-cli start swap <quote|execute|status> --help`.

To propose a swap for the human's approval with no device on this machine, use `agent-intent swap` instead: [agent-intent.md](agent-intent.md), step 8.

## Identifiers

- **Currencies:** `--from` / `-f` and `--to` / `-t` take Ledger currency ids, never session labels: `bitcoin`, `ethereum`, `solana`, or a token id on those chains such as `ethereum/erc20/usd_tether__erc20_`. Get a token id from `pnpm --silent wallet-cli start assets token ethereum <contract>`.
- **Accounts:** session labels. `swap quote` takes `--from-account` and `--to-account`; `swap execute` takes `--account` (or the label as first positional) and `--to-account`. Each currency must match its account: a token on `--from` needs an `--account` on the token's chain that already holds that token.
- **Amount:** a plain number in source currency units, `--amount 0.1`, with no ticker (unlike `send` and `earn`).
- **Providers:** `changelly`, `changelly_v2`, `cic`, `cic_v2`, `exodus`, `lifi`, `nearintents`, `okx`, `oneinch`, `swapsxyz`, `uniswap`, `velora`; aliases `changelly` (for `changelly_v2`) and `1inch` (for `oneinch`). `swap quote` queries all of them.

## 1. Quote

```bash
pnpm --silent wallet-cli start swap quote --from ethereum --to bitcoin --amount 0.1 --from-account ethereum-1 --to-account bitcoin-native-1 --output json
```

Show the human the quotes: provider id, amount out, rate. Done when the human has picked one quote and confirmed the amount.

## 2. Execute

`swap execute` has no dry run mode: the quote from step 1 is the preview, so execute only after the human confirmed it. Pass the provider id from the chosen quote line as `--provider`.

```bash
pnpm --silent wallet-cli start swap execute --from ethereum --to bitcoin --account ethereum-1 --to-account bitcoin-native-1 --provider changelly --amount 0.1 --output json
# DEX provider: EVM source and destination
pnpm --silent wallet-cli start swap execute --from ethereum --to ethereum/erc20/usd_tether__erc20_ --account ethereum-1 --to-account ethereum-1 --provider uniswap --amount 0.1
```

The provider decides the pipeline, and so what the device asks for:

- **DEX providers (`uniswap`, `oneinch`, `velora`, `okx`) with an EVM source account** run end to end in the partner's embedded coin app on the device. The CLI fetches a fresh quote from that provider, so the executed rate can differ slightly from step 1. The device may switch apps and ask several times (open the app, sign an approval or permit, sign the swap): tell the human to confirm each `Open <app>` and signing prompt. The result carries `swapTxHash` (and `approvalTxHash` when an approval ran), with no `swapId`.
- **Every other provider** runs the legacy Exchange-app pipeline (nonce, payload, complete exchange, sign and broadcast); the device opens the Exchange app. The result carries `swapId`, used by step 3.
- **Fallbacks to the legacy pipeline:** a DEX provider with a non-EVM source account, and a DEX quote that resolves to an RFQ plan (the CLI does not support RFQ; it prints `falling back to legacy Exchange-app pipeline`).

`--fee-strategy slow|medium|fast` (default `medium`) sets the refund-chain transaction fee on the legacy pipeline.

Done when the command exits 0 and the human has the `swapId` or `swapTxHash`.

## 3. Status

```bash
pnpm --silent wallet-cli start swap status --swap-id <swapId> --provider changelly --output json
```

`--swap-id` is the `swapId` from a legacy-pipeline execute, and `--provider` its provider. A DEX swap has no `swapId`: look for its `swapTxHash` in `pnpm --silent wallet-cli start operations <label>`.

## Errors

| Message | Cause | Action |
|---|---|---|
| `Unsupported swap provider` | provider outside the list above | use the provider id from the quote line |
| `Unsupported swap from currency` / `Unsupported swap to currency` | currency id is not bitcoin, ethereum, solana or a token on them | out of scope; tell the human |
| `No quotes available: amount too low (minimum: ...)` / `amount too high (maximum: ...)` | amount outside the providers' limits | tell the human the limit and ask for a new amount |
| `Swap execute requires --to-account` | missing destination | add `--to-account <label>` |
| `--from account is ... but --from is ...` / `token ... belongs to ...` / `has no token sub-account` | currency and account disagree | fix the account or the currency id with the human |
| `No quote from '<provider>'` | the DEX re-quote failed | back to step 1 and let the human pick again |

Device errors (rejected, not detected, timeout) are in [errors.md](errors.md).
