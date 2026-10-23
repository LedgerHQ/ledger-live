# Earn: staking and DeFi yield

Earn covers two flows: **Ethereum** ERC-4626 vaults (deposit, redeem) and **Solana** native staking (delegate, undelegate). `earn yields` and `earn positions` are read-only and need no device; `earn deposit` and `earn withdraw` sign on the device and always take the dry run first (SKILL.md, Safety rules). Only ethereum and solana accounts can deposit and withdraw; other networks in `earn yields` are informational.

Exact flags: `pnpm --silent wallet-cli start earn <yields|positions|deposit|withdraw> --help`.

## Find a product: earn yields

`earn yields -n <network>` is the only way to discover a valid `--product`:

```bash
pnpm --silent wallet-cli start earn yields                      # headline rates
pnpm --silent wallet-cli start earn yields -n solana
pnpm --silent wallet-cli start earn yields -n ethereum --output json
```

- Without `-n`, it lists headline rates only for networks with discovered accounts; `--all` lists every supported network.
- With `-n ethereum` or `-n solana`, each deposit target ends with `→ --product <id>`; in JSON the value is `vaultId` (Ethereum) or `validator` (Solana). `--limit` caps the number of targets.
- **Ethereum:** vault ids such as `1_0x7daeba3f217614e409f85d3014d33923a6b03630`.
- **Solana:** validator vote accounts. The Ledger-operated validators ("Ledger by Figment", "Ledger by Bitwise") are the recommended targets; any other valid vote account also works.

## Positions and stake accounts

```bash
pnpm --silent wallet-cli start earn positions solana-1 --output json
pnpm --silent wallet-cli start earn positions solana-1 --fresh
```

- Account-based networks only (ethereum, solana).
- `--fresh` asks the backend to refresh stale rows; the refreshed data appears on a **re-run**, not in the same response. A `(stale)` marker means re-run.
- **Solana stake accounts** come only from here: each prints `→ --stake-account <address>`, its `state` (active, inactive, activating, deactivating), balance and validator. In JSON they form a top-level `stakes[]` array beside `positions` (fields `stakeAccount`, `validator`, `state`, `stakeBalance`, `withdrawable`), omitted when there are none. They show up right after a deposit even when the backend snapshot is still empty. When the chain cannot be reached, the command prints the backend snapshot with a warning.

## Deposit

`--amount` needs a ticker; on Ethereum it is the vault's asset.

```bash
# Solana: --product is a validator vote account
pnpm --silent wallet-cli start earn deposit solana-1 --product 26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx --amount '1.5 SOL' --dry-run
# Ethereum: --product is a vault id
pnpm --silent wallet-cli start earn deposit ethereum-1 --product 1_0x7daeba3f217614e409f85d3014d33923a6b03630 --amount '100 USDC' --dry-run
```

Then the same command without `--dry-run` once the human confirms.

- **Solana:** one transaction (`stake.createAccount`) creates **and** delegates the stake account.
- **Ethereum:** up to two transactions, an ERC-20 `approve` then the `deposit`, each signed on the device.

**First-time Ethereum vault deposit: the dry run cannot validate the deposit leg.** The deposit can only be built once a non-zero allowance exists on-chain, and a dry run broadcasts nothing. So when an approve is still needed, the dry run validates the approve and skips the deposit: the deposit row shows `not-simulated (broadcast the approve first to raise the allowance)` and the overall status `dry-run: approve validated; deposit needs an on-chain allowance to simulate`. This is expected, not a balance error. Treat it as "the approve is fine", tell the human the deposit leg is validated only by the live run, and confirm with them before it (two irreversible device signatures). Once the allowance exists, a new dry run simulates the deposit normally.

## Withdraw

- **Ethereum:** `--product <vault-id>` is required, `--amount` is optional and in the vault's asset units (`'50 USDC'`; the ticker must match the vault asset). **For a full exit, omit `--amount`:** the CLI asks the backend to redeem the entire share balance, leaving no dust. The share to asset rate drifts, so a computed "full" amount leaves dust.
- **Solana:** `--stake-account <address>` is required (from `earn positions`) and covers the whole stake account; `--amount` is rejected. Unstaking is **two-phase**:
  1. run once to undelegate (deactivate) the stake account;
  2. after the deactivation epoch boundary (about 2 to 3 days; `earn positions` shows the stake account as `inactive`), re-run with `--finalize` to withdraw the lamports to the main account.

```bash
pnpm --silent wallet-cli start earn withdraw ethereum-1 --product 1_0x7daeba3f... --amount '50 USDC' --dry-run
pnpm --silent wallet-cli start earn withdraw solana-1 --stake-account <stakeAccount> --dry-run              # phase 1
pnpm --silent wallet-cli start earn withdraw solana-1 --stake-account <stakeAccount> --finalize --dry-run   # phase 2
```

`--device-timeout <ms>` (default 60000) is how long deposit and withdraw wait for the human to unlock or confirm on the device; raise it when the human needs more time.

## Errors

| Message | Cause | Action |
|---|---|---|
| `Partial Solana withdraw is unsupported: omit --amount` | `--amount` on a Solana withdraw | drop `--amount` |
| `Solana withdraw requires --stake-account` | missing stake account | take it from `earn positions <label>` |
| `EVM withdraw requires --product` | missing vault id | ask the human which vault; `earn yields -n ethereum` lists vault ids |
| `Amount ticker "..." does not match the vault asset` | ticker is not the vault's asset | use the asset named in the message |
| `Earn positions are only supported for account-based networks` | bitcoin label | ethereum or solana only |
| `Unsupported family for earn` | deposit or withdraw outside ethereum and solana | out of scope; tell the human |
| `Solana requires at least ... per stake account` / `Max stakeable is` | a Solana deposit below the network minimum delegation, or above what the account can stake after rent and fees | tell the human the minimum and the max stakeable amount from the message and ask for an amount between them; when the message says `cannot stake until it receives`, no amount works yet: tell the human how much SOL the account needs and stop ([business-logic.md](business-logic.md), Solana stake minimum) |
| `Refusing to deposit: vault ... is not currently depositable` | vault closed to deposits | pick another vault with the human |
| `Refusing to sign ...` | the backend transaction failed a safety check (wallet, target, value or chain id) | stop and report the message to the human; leave the check in place |

Device errors (rejected, not detected, timeout) are in [errors.md](errors.md).
