# Regression cases — device required

Every case here drives a command that talks to the Ledger, so it needs the device connected
and unlocked and a person to confirm on-screen. Nothing automates this: wallet-cli speaks
USB/DMK only and has **no Speculos support**.

## Protocol

- **One command per case.** Run it, confirm on the device, record the result before moving on.
- **Always `--output json`.** The exit code plus the `device-state` events (`awaiting_approval`
  with its `reason`, terminal states) are the oracle — not "it looked fine".
- **Exit codes are the contract** (`src/device/device-state.ts`): `0` success, `2` rejected,
  `3` disconnected, `4` wrong app, `5` app not installed, `6` timeout/locked.
- **Never run two device commands at once** — concurrent APDU traffic garbles the session.
- **Batch by device app** (all Ethereum cases, then Bitcoin, then Solana) to cut app switching.
- **Use the dedicated regression wallet**, with the amounts written in the case. Don't improvise
  with real funds.
- **Record per case:** command, exit code, the JSON envelope, what the device screen showed,
  and the tx hash where one is produced.
- **Start E9 (Solana undelegate) on day one** — its finalize step needs the deactivation epoch
  boundary to pass (~2–3 days).

## Suite E — device basics

| ID | Case | Expected |
| --- | --- | --- |
| E1 | `genuine-check`, device on the dashboard | genuine, exit 0 |
| E2 | `genuine-check` with a currency app open | `[✖] Wrong app. Open Ledger dashboard.`, exit 4 |
| E3 | `genuine-check` with the host offline | clean network error, no crash |
| E4 | `account discover ethereum` / `bitcoin` / `solana` | accounts found, labels `<network>[-derivation]-<n>`, persisted; no raw V1 descriptor in the output |
| E5 | `account discover ethereum:sepolia` / `bitcoin:testnet` / `solana:devnet` | testnet labels (e.g. `ethereum-sepolia-1`); discovery only |
| E6 | `receive <acct>` | **terminal address matches the device screen character for character** |
| E7 | `receive <acct> --no-verify` | no device prompt, same address as E6 |
| E8 | `receive` on each bitcoin derivation (native/taproot/segwit/legacy) | correct address format per derivation |
| E9 | device locked when a command starts | `awaiting_approval`, `reason: unlock`; resumes after PIN, no spurious timeout |
| E10 | app not installed for the target network | exit 5 with an install hint |
| E11 | unplug mid-command | exit 3, clean DMK teardown; the next command works without replugging twice |

## Suite F — send

| ID | Case | Amount | Expected |
| --- | --- | --- | --- |
| F1 | native ETH | 0.0001 ETH | device shows amount/recipient/fees; `hash:` on stdout; appears in `operations` |
| F2 | ERC-20 | 0.01 USDC | clear-signed token transfer, correct decimals and symbol |
| F3 | BTC with `--fee-per-byte` + `--rbf` | dust-safe minimum | fee rate respected, RBF flagged |
| F4 | SOL with `--memo` | 0.001 SOL | memo instruction present on-chain |
| F5 | reject on device | — | exit 2, "No action taken", nothing broadcast |
| F6 | approve, then unplug before broadcast | — | clean error; no half-broadcast state |

## Suite G — swap execute

Small amounts. G1 is the check for 2.1.0's display-unit change; the conversion itself is
unit-tested, so one hardware confirmation per output mode is enough.

| ID | Case | Expected |
| --- | --- | --- |
| G1 | small swap, legacy provider, `--output json` | `amountExpectedTo` in **display units**, `amountExpectedToAtomic` alongside it, `magnitudeAwareRate` unchanged (atomic/atomic) |
| G2 | same run, human output | "Amount expected to:" in display units with the right magnitude |
| G3 | legacy pipeline ETH→BTC end to end | nonce → payload → complete exchange → sign → broadcast; Exchange app session stays open throughout; `hash:` emitted |
| G4 | DEX provider (`uniswap`) ETH→USDT, EVM source | embedded coin-app flow: `Open <app>` prompts, approval/permit2/swap signatures, broadcast |
| G5 | DEX provider with a non-EVM source account | falls back to the legacy pipeline |
| G6 | a quote that resolves to an RFQ plan | `falling back to legacy Exchange-app pipeline`, then legacy flow |
| G7 | reject on device | exit 2, nothing broadcast |
| G8 | `--fee-strategy slow` vs `fast` | refund-chain fee differs accordingly |
| G9 | swap into a token account that doesn't exist yet | succeeds (destination account created) |
| G10 | `swap status --swap-id <from G3> --provider <same>` | real status progression |
| G11 | analytics for a completed swap (Segment debug) | `swap_completed` carries `provider`, `fromCurrency`, `toCurrency`, and `toAmount` in display units |

## Suite H — earn deposit / withdraw

| ID | Case | Expected |
| --- | --- | --- |
| H1 | `earn deposit <sol> --product <Ledger validator> --amount '1 SOL'` | `stake.createAccount` creates **and** delegates in one tx |
| H2 | `earn positions <sol>` after H1 | the new stake account listed with `→ --stake-account`, state `activating` |
| H3 | `earn withdraw <sol> --stake-account <addr>` | undelegate signed; state → `deactivating` |
| H4 | `earn withdraw <sol> --stake-account <addr> --finalize` after the epoch boundary | lamports back on the main account; `--amount` ignored |
| H5 | `earn deposit <eth> --product <vaultId> --amount '1 USDC'`, first deposit | Ethereum app opens with the **Kiln** clear-signing dependency; `approve` then `deposit`; on-chain status polled |
| H6 | `earn withdraw <eth> --product <vaultId>` with no `--amount` | full exit, no dust left |
| H7 | reject either leg of H5 on device | exit 2; the approve tx state is reported accurately |

## Suite I — ring (LKRP)

Password comes from the OS keychain via command substitution
(`WALLET_PASS=$(security find-generic-password …)`). Never type a literal, not even a
throwaway. `ring decrypt` output is secret — pipe it to a file or the clipboard, never to a
terminal or a log.

| ID | Case | Expected |
| --- | --- | --- |
| I1 | `ring init --name <machine>` with `WALLET_PASS` injected | provisioned via the device; trustchain meta recorded in the session |
| I2 | `ring encrypt --key k -i f -o f.enc`, then `ring decrypt` | round-trips, **no device** after init |
| I3 | stdin/stdout round-trip | text round-trips |
| I4 | decrypt with the wrong `--key` | fails, mentions wrong key / corruption / rotation |
| I5 | `ring keys` | lists the key names used on this machine |
| I6 | encrypt/decrypt with the host offline | clear error (LKRP restore needs network) |
| I7 | `ring destroy` with a wrong password | aborts, no changes |
| I8 | `ring destroy` with `WALLET_PASS` set but empty | aborts (treated as a failed keychain lookup) |
| I9 | `echo destroy | ring destroy` with the right password | remote application closed, local credentials wiped |
| I10 | decrypt data encrypted before a ring rotation | `⚠ Ledger Key Ring rotated` warning + actionable error |
| I11 | encrypt after the wallet-cli application was deactivated on the ring | actionable guidance, not a raw SDK error |

## Suite J — platform matrix

Per platform, at minimum: `--version`, `skill install --agent claude`, `session view`, and one
device command (`receive`).

| ID | Case | Expected |
| --- | --- | --- |
| J1 | each built binary (`darwin-arm64`, `linux-x64`, `linux-arm64`, `windows-x64`) | `--version` correct |
| J2 | after publish, `npm i -g @ledgerhq/wallet-cli@<version>` on a clean machine | right platform package resolved; commands work |
| J3 | Linux without USB build deps | actionable error naming `libudev-dev` / `libusb-1.0-0-dev` |
| J4 | Windows | `skill install` writes `.claude\skills\…`; `--file references\business-logic.md` resolves |
| J5 | `USER_ID` unset | defaults to `wallet-cli` (stable DMK salt) |

## Gaps worth closing as tests, not as manual steps

These are device-shaped behaviours the in-process mock DMK could assert (see
[README](./README.md)), but that no test covers today. Turning them into `bun test` cases
would take them off the manual pass permanently:

- **Per-command wiring of terminal device states.** The state → exit-code mapping is
  unit-tested, but only `genuine-check` asserts it end to end. `send`, `swap execute`,
  `earn deposit/withdraw` and `receive` have no case for rejected (2), disconnected (3),
  wrong app (4), app-not-installed (5) or locked/timeout (6).
- **`send` beyond dry-run.** No mocked sign-and-broadcast case: the `hash:` stdout contract
  and the operation-serialisation path are only exercised on hardware today.
- **`earn deposit/withdraw` signing dispatch.** Pipeline-level tests exist, but not the
  command-level path from flags through signing to broadcast.
- **Fee strategy.** `--fee-strategy slow|medium|fast` has no assertion that the choice
  reaches the built transaction.
- **Mid-flow interruption.** No case for a device disappearing between signature and
  broadcast, which is exactly where a partial state would be worst.
