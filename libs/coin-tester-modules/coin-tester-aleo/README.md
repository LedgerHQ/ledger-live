# @ledgerhq/coin-tester-aleo

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

This package contains the testing infrastructure for Aleo in Ledger Live,
running the `@ledgerhq/coin-aleo` bridge end to end against a local devnode and
a local Aleo SDK backend. `src/scenarii.test.ts` registers four scenarios:

- **Public credit transfer** — sends credits from a funded sender to a fresh
  recipient and checks both sides through the bridge
- **Public send-max** — sends a sender's full public balance to a fresh
  recipient. The fee is sponsored, so nothing is left behind
- **Private credit transfer** — converts two public balances into private
  records, then sends credits privately to a fresh recipient out of one record
  and leaves the other unspent
- **Private-to-public credit transfer** — unshields a private record back
  into a public balance for the same account

## Features

- Deterministic scenarios covering `transfer_public`, a public send-max,
  `transfer_private`, and a private-to-public unshield, exercised through the
  real `coin-aleo` bridge with sponsored fees, as in production
- Docker-based stack: an `aleo-devnode` (a single-account Aleo devnode,
  `127.0.0.1:3030`) and an `aleo-backend` (the Rust Aleo SDK backend,
  `127.0.0.1:3031`) that prepares and signs transaction requests
- A software signer that matches the DMK Aleo signer's wire output, plus a
  record resolver for signing over private record inputs
- An `msw`-based indexer and scanner double that stand in for the production
  indexer and record-scanning service
- The Docker stack is shared across the whole test file — `beforeAll` in
  `src/scenarii.test.ts` brings it up once, and every scenario in the file
  runs against that same stack rather than getting one each
- A devnode has no consensus: a block seals only when a transaction is
  broadcast, or when the harness calls `advanceBlocks()` (`src/devnode.ts`) by
  hand. Confirmations and finalized reads must be driven explicitly — waiting
  on a height to advance on its own hangs the test

## Usage

The package exports no scenarios: they rely on the Docker stack that
`src/scenarii.test.ts` brings up and tears down. Run them with:

```sh
pnpm start
```

## Development

`pnpm start` spins up the Docker stack, runs `src/scenarii.test.ts` and
`src/negativeCases.test.ts`, then tears the stack down.

The first run builds the `aleo-devnode` image, which downloads the `leo`
binary and checks it against the SHA-256 pinned in `aleo-devnode.Dockerfile`.

The `aleo-backend` image is not built from this repo. `docker-compose.yml`
pulls `jfrog.ledgerlabs.net/bbs-oci-prod-green/aleo-backend` pinned by tag and
digest. Pulling it locally requires the Ledger VPN and a
`docker login jfrog.ledgerlabs.net`; CI logs in through `jfrog-login`.

### Fee sponsorship

Production runs with `isFeeSponsored: true`: Provable's fee master pays the
fee, and the user's balance moves by the amount only. The tester runs the
bridge with the same setting. `buildAleoCoinConfig` (`src/fixtures.ts`)
differs from production only in `useEncryptedProve: false`.

The fake prover (`src/msw/prove.ts`) rejects any request that carries a fee
authorization. It rebuilds the user's transaction on the devnode, where the
user signs a `fee_public`, then pays that fee back from a generated sponsor
account (`src/msw/sponsor.ts`) before it broadcasts the transaction. The
indexer double hides the sponsor's transfers. As a result, balances, operation
values and `op.fee` match production.

One gap remains: on chain, the user signs the fee transition, not a fee
master. coin-aleo never reads the fee signer. The setup paths that skip the
prove handler (genesis funding, record minting, the rejected-finalize test)
still pay their own fees.

Not covered, and left to the fee-sponsoring epic: the unsponsored path
(`isFeeSponsored: false`), fee records, the multi-record batcher send-max, and
token transfers (`enableTokens` is off in production).

### Known wasm defects

- **A decrypted record prints `_version` one below the chain's value**
  (sdk 0.11.4 / wasm 0.11.11). Every commitment derived from that plaintext is
  one the chain never produced, so a signature over a private record input is
  rejected by `aleo-backend`. `correctRecordVersion` (`src/msw/records.ts`) bumps
  it by one, unconditionally.
- **Two oracles pin the workaround**, both in `src/scenarii.test.ts` ("signs a
  transfer_private root intent the backend accepts"): `aleo-backend`'s
  `record_commitments[0]` must equal the chain's record `id`, and
  `POST /transactions/authorization` must accept the signature. Both go red
  once an SDK release prints the right version, which is the signal to drop
  the `+1`.
- **Production is unaffected.** `@provablehq/sdk` is only a devDependency of
  `coin-aleo`, used by its test helpers.

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-aleo
- @ledgerhq/ledger-wallet-framework
- @provablehq/sdk
