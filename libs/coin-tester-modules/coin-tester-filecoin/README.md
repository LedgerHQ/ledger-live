# @ledgerhq/coin-tester-filecoin

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Deterministic integration tester for the Filecoin family. Asks coin-sandbox for a Lotus
node and its Filecoin API stub (the indexer coin-filecoin reads), then runs the same send
scenario through the legacy bridge and the generic-adapter bridge.

## Run

```sh
COIN_SANDBOX_FILECOIN='--node lotus@1.39.1 --indexer filecoin-api-stub' pnpm coin:tester:filecoin start
```

Requires coin-sandbox's server running (`deno task server` in its repository, port 8000;
`COIN_SANDBOX_URL` points elsewhere) and a Docker daemon. `COIN_SANDBOX_FILECOIN` gives the
node and indexer versions. Each strategy asks for its own instance, brought up from a fresh
genesis (a few minutes), and removes it at the end.

`pnpm --filter @ledgerhq/coin-tester-filecoin exec jest src/signer.test.ts` runs the signer's
unit tests, which need no Docker.

Ledger Live signs with a software signer (`iso-filecoin`, glif path `44'/461'/0'/0/<n>`), not
the device: this proves the bridge and coin-filecoin, not what the Filecoin app accepts or shows.

## Coverage

| # | Step | Asserts | Strategies |
| --- | --- | --- | --- |
| before | Sync after the airdrops | balance is the FIL airdropped; one `IN`, no `OUT`; the USDFC sub-account holds the token airdrop with one `IN` | both (token part: legacy) |
| 1 | Send 1 FIL to an `f1` address | operations +1, `OUT`, value = amount + fee, balance lowered by the value | both |
| 2 | Send 1 FIL to a `0x` address | `OUT`, the recipient is recorded in its `f410` form, balance lowered | both |
| 3 | Send 10 USDFC to a `0x` address | token operations +1, `OUT`, value 10 USDFC, token balance lowered | legacy |
| 4 | Send all USDFC | token `OUT`, token spendable balance 0 | legacy |
| 5 | Send max FIL to an `f1` address | `OUT`, balance lowered by the value, what stays is positive and at most the gas reservation | both |
| after | Operation counts | legacy: 3 `OUT`, 2 `FEES`, 1 `IN` on the parent, 2 `OUT` and 1 `IN` on the token account; generic-adapter: 3 `OUT`, 1 `IN` | both |

The two `FEES` rows are the zero-value InvokeEVM messages of the token sends.

## Notes

- The ERC-20 steps are legacy only: the generic-adapter's `getBalance` returns FIL only
  (`logic/account/getBalance.ts` in coin-filecoin), so tokens never reach the generic sync. This is
  also why `localApiServesAccountData` is `false` for the family.
- The token balance of an `f1` account is keyed by its ID-masked address: `0xff`, 11 zero bytes and
  the actor id. The tester airdrops FIL first, reads the actor id with `Filecoin.StateLookupID`, then
  airdrops USDFC to that masked address; the indexer serves the balance and history as the `f1`'s.
- Send max reserves the fee cap times the gas limit, and Lotus refunds what the message did not
  use, so the balance after a send max is not 0. The step asserts it is positive and at most the
  message's reservation.
- Each step waits on `Filecoin.StateWaitMsg` for the message to execute, which is when the indexer
  lists it.

## Layout

| File | Role |
| --- | --- |
| `src/sandbox.ts` | The sandbox instance, Lotus RPC reads, message wait, masked address |
| `src/signer.ts` | Software signers for the legacy and the generic-adapter bridges |
| `src/fixtures.ts` | Currency, USDFC token and its store, recipients, account factory |
| `src/helpers.ts` | `getBridges(strategy, signers)`, the local config, funding |
| `src/scenarii/filecoin.ts` | The scenario |
| `src/scenarii.test.ts` | Runs the scenario under each strategy |
| `src/signer.test.ts` | Unit tests of the signers |
