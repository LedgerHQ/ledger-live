# @ledgerhq/coin-tester-casper

This package boots a local Casper 2.x network in Docker and checks that
`@ledgerhq/coin-casper` can read from it through its own API layer.

## Run

```sh
pnpm coin:tester:casper start
```

Needs a Docker daemon reachable **without `sudo`** — compose shells out to a
plain `docker`, so if `docker ps` fails but `sudo docker ps` works, add
yourself to the `docker` group (`sudo usermod -aG docker "$USER"`, then log
out and back in). Do not run the suite under `sudo`: that would execute
pnpm and node as root and leave root-owned files in `node_modules` and the
pnpm store.

Set `DEBUG=1` to stream the docker compose output.

The signer test does not need Docker or RPC, so it runs on its own:

```sh
pnpm --filter @ledgerhq/coin-tester-casper exec jest src/signer.test.ts
```

## What runs

`ghcr.io/veles-labs/casper-devnet` ships `casper-node` and `casper-sidecar` in
one asset bundle and supervises both from a single Rust binary. In Casper
2.x the node itself does not serve JSON-RPC, the sidecar does, so a local
network needs a node and a sidecar at matching versions.

Only JSON-RPC (`11101`) is published. REST (`14101`), SSE (`18101`), and the
binary port (`28101`) stay internal because the module does not use them.
Every run starts from a fresh genesis, so nothing persists between runs.

## Verified contract of the pinned image

The table below was measured against the pinned image. Re-measure it on
every image bump: the digest pin buys reproducibility, but it also means
Docker will not warn you when the underlying binary changes behavior.

| Property | Value |
| --- | --- |
| Image | `ghcr.io/veles-labs/casper-devnet:v0.10.1@sha256:c691d3f30e1c75c6366e80fa6e3be2baddae5fa0eaca07b91c1cefc3f87a39bc` |
| Platform | `linux/amd64` only, an arm64 host needs emulation |
| `api_version` / `build_version` | `2.0.0` / `2.2.0-057cf21` |
| JSON-RPC path | `http://localhost:11101/rpc`, the bare host and `/` both 404 |
| `chainspec_name` | `casper`, matching `CASPER_NETWORK` |
| Derivation | secp256k1 over BIP32 `m/44'/506'/0'/0/<n>`, validators from 0, users from 100 |
| User public key | `02` tag plus a 33-byte compressed key, 68 hex chars total |
| Genesis user balance | 1000000000000000000000000000000000000 motes, no faucet step needed |
| `state_get_balance` | still works, even though the 2.x docs mark it deprecated |
| `network <name> is-ready` | exits 0 when ready, exits 1 for both "not ready" and "assets not found" |
| Peak container memory | about 168 MiB (cgroup `memory.peak`, sampled across a full test run), from 4 `casper-node` and 4 `casper-sidecar` processes |
| Native transfer cost | `[system_costs.mint_costs] transfer = 100_000_000` motes, exactly `CASPER_FEES_MOTES`. A real 10 CSPR transfer measured `cost = consumed = limit = 100000000` |
| Fee economics | `pricing_handling = payment_limited`, `fee_handling = burn`, `refund_handling = refund 75%`, `min_gas_price = max_gas_price = 1`, so the charge has no dynamic component |

`derive --secret-key` prints a multi-line, CRLF-terminated PEM block, not
bare hex. Only `derive --public-key` and `derive --account-hash` print bare
hex.

The account hash has two shapes depending on where it comes from. The raw
RPC `state_get_account_info` response prefixes it with `account-hash-`,
while the CLI's `derive --account-hash` prints it without the prefix.
`fetchAccountStateInfo` calls `.toHex()` on the RPC value, so the module's
own return shape is the unprefixed form, matching the CLI.

`docker-compose@1.1.0`'s `exec` splits a string command on whitespace with
no quote-awareness. Since the derivation path contains `'` characters,
`src/casperDevnet.ts` passes the derive command as an array instead.

## Signer

`signOperation` hands the signer `Transaction.toBytes()`, not a hash. A
signature over those bytes fails `validate()` with `invalid signature`. The
hash is already inside the bytes: `toBytes()` is a calltable serialization,
`[u8 version][u32 field count][(u16 index, u32 offset) × N][u32 blob length][blob]`,
where field 0 is the 32-byte hash and field 1 is the payload, and
`blake2b256(field 1) === field 0`.

`src/signer.ts` reads the header, checks that identity, and signs field 0.
The result is byte-for-byte what `tx.sign(privateKey)` produces. The device
app gets the same bytes and derives the hash the same way, so
`signOperation` needs no change.

`CalltableSerialization` exists in casper-js-sdk, but the package does not
export it from its single entry point (`dist/lib.node.js`), so we wrote our
own header parser. It reads offsets from the header rather than assuming
them, but it was only measured against a native transfer, other transaction
shapes are unchecked.

`derive --secret-key` prints a SEC1 `EC PRIVATE KEY` block with CRLF line
endings. `PrivateKey.fromPem` accepts it as printed, and after `trim()`.
`publicKey.bytes()` returns the 34-byte tagged form, so the signer returns
`bytes().subarray(1)`, and the module's resolver adds the `02` tag back.

## Constraints

`--node-count` must be at least 4. The image's asset template bakes in
`min_peers_for_initialization = 3` with no override flag, and with N nodes
each node sees at most N−1 peers, so N ≤ 3 stalls in
`reactor_state: "Initialize"`.

There is no `--chainspec-override`. Blocks already land every ~3 seconds,
and `core.minimum_era_height=1` crashes the node with `invalid chainspec`
because validation requires `signature_rewards_max_delay <
minimum_era_height`. Era timing only affects staking, which this package
does not exercise anyway.

## Scope

`src/devnet.test.ts` checks the infrastructure. `src/scenarii.test.ts`
sends five transfers from user 0 to user 1 through the full bridge path and
asserts the OUT operation on the sender and the IN operation on the
recipient for each one.

The two suites share one devnet, booted once by `src/globalSetup.ts` and
torn down by `src/globalTeardown.ts` for jest's `devnet` project.
`devnet.test.ts` derives `DEVNET_SANITY_USER_INDEX` (fixtures.ts) instead of
the scenario's sender index, so its genesis-balance assertion holds no
matter which suite runs first.

### What the indexer mock does and does not prove

`getAccountShape` reads balance and block height from the node RPC, but
takes operations only from the indexer. Since the devnet has no indexer,
`src/indexer.ts` serves `accounts/<publicKey>/ledgerlive-deploys` from
`msw`. For each transfer it reads the transaction back from the node RPC
and indexes that record under both parties' public keys, the way the real
indexer would.

`optimistic.hash` is the only value that crosses from the module into the
mock. Every other field in the served entry, cost, status, error message,
arguments, comes from the node's own record of the transaction. So when the
chain rejects a transaction, that shows up through `error_message` into
`status: "failed"` into `operation.hasFailed`, and the scenario checks for
exactly that.

The scenario points `API_CASPER_INDEXER` at `http://casper-indexer.mock/`.
`src/devnet.test.ts` keeps `http://127.0.0.1:1/`, so an accidental
`fetchTxs` call there fails fast on a dead port instead of hanging.

### Pinned module behavior

The table below records what `@ledgerhq/coin-casper` does today. It is not
a claim that this behavior is correct.

| Behavior | Where |
| --- | --- |
| `fee` on both operations comes from the `CASPER_FEES_MOTES` constant (0.1 CSPR), never from the chain | `mapTxToOps` |
| `fee` is set on the IN operation too, even though the recipient pays nothing | `mapTxToOps` |
| `blockHeight` is hardcoded to `1`, the scenario does not check it | `mapTxToOps` |

Each send's balance assertion is a plain equality: the sender's balance
drops by the operation's full `value`. After all five sends, the
recipient's balance has risen by `GENESIS_USER_BALANCE_MOTES` minus five
times `CASPER_FEES_MOTES`, the sender's genesis balance, less one fee per
send. That works because the devnet charges a flat fee for a native
transfer, and that fee happens to match the module's constant (see the
table above). Each equality also pins `CASPER_FEES_MOTES` against the
chain's real cost, so if an image bump changes that cost, the assertion
fails and the module's hardcoded fee is what needs fixing.

`mapTxToOps` reads `txArgs.id` inside a `try` block whose `catch` turns any
error into a warning and an empty operation list. If an entry lacks
`args.id`, reading it throws a `TypeError`, but `src/indexer.ts` declares
its factory's return type as `ITxnHistoryData`, where `args.id` is
required, so the compiler catches that case before it happens.