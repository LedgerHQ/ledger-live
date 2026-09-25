# @ledgerhq/coin-tester-aleo

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

This package contains the testing infrastructure for Aleo in Ledger Live,
running the `@ledgerhq/coin-aleo` bridge end to end against a local devnode and
a local Aleo SDK backend. `src/scenarii.test.ts` registers six scenarios:

- **Public credit transfer** — sends credits from a funded sender to a fresh
  recipient and checks both sides through the bridge
- **Public send-max** — sends a sender's full public balance to a fresh
  recipient
- **Private credit transfer** — converts two public balances into private
  records, then sends credits privately to a fresh recipient
- **Private send-max** — mints 15 private records for a sender, then sends
  the sum of the 14 largest to a fresh recipient. The smallest record pays the
  fee. This scenario is skipped: the batcher program passes the credits
  records to credits.aleo as `external_record` inputs, and the TLV decoder in
  `src/tlv/decodeRequest.ts` covers only record and plaintext input types
- **Public ARC-22 token transfer** — sends a minted USAD token balance from a
  funded sender to a fresh recipient
- **Private-to-public credit transfer** — unshields a private record back
  into a public balance for the same account

## Features

- Deterministic scenarios covering `transfer_public`, `transfer_private`,
  send-max on both, an ARC-22 token transfer, and a private-to-public
  unshield, exercised through the real `coin-aleo` bridge
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
  broadcast, or when the harness calls `advanceBlocks()` (`src/stack.ts`) by
  hand. Confirmations and finalized reads must be driven explicitly — waiting
  on a height to advance on its own hangs the test

## Usage

```typescript
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioTransferPublic } from "@ledgerhq/coin-tester-aleo/scenarii/transferPublic";
import { scenarioSendMaxPublic } from "@ledgerhq/coin-tester-aleo/scenarii/sendMaxPublic";
import { scenarioTransferPrivate } from "@ledgerhq/coin-tester-aleo/scenarii/transferPrivate";
import { scenarioTransferTokenPublic } from "@ledgerhq/coin-tester-aleo/scenarii/transferTokenPublic";

await executeScenario(scenarioTransferPublic);
await executeScenario(scenarioSendMaxPublic);
await executeScenario(scenarioTransferPrivate);
await executeScenario(scenarioTransferTokenPublic);
```

## Development

Run the scenarios with `pnpm start`. The script spins up the Docker stack,
runs the Jest test file, then tears the stack down.

The first run builds both images: `aleo-devnode` downloads the `leo` binary,
`aleo-backend` runs a `cargo build`.

### Known wasm defects

`@provablehq/wasm` derives a record's commitment one `_version` below the
chain's value, which breaks signing over private record inputs unless
corrected. See
[`docs/wasm-record-commitment.md`](docs/wasm-record-commitment.md) for the two
defects, the workaround (`correctRecordVersion` in `src/msw/prove.ts`), and the
oracles that would catch a future SDK fix.

## Dependencies

- @ledgerhq/coin-tester
- @ledgerhq/coin-aleo
- @ledgerhq/ledger-wallet-framework
- @provablehq/sdk
