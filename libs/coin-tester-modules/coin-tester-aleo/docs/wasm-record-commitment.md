# `@provablehq/wasm` record `_version` defects

Two defects, one root cause. The wasm bindings treat a record's `_version` field
one index below the chain's value:

1. **Defect 1** — a commitment derived from a decrypted `RecordPlaintext`
   disagrees with the commitment the chain published for that record. Measured
   at 0.10.2.
2. **Defect 2** — a decrypted plaintext *prints* `_version` one lower than the
   chain's. Measured at 0.11.4, the version the tester runs.

snarkVM in Rust is unaffected by either.

## Environment

| | |
| --- | --- |
| `@provablehq/wasm` / `@provablehq/sdk` | 0.10.2 (testnet build) — defect 1 |
| `@provablehq/wasm` / `@provablehq/sdk` | 0.11.4 — defect 2, and the version the tester runs |
| chain | `leo devnode` 4.3.4, REST `http://127.0.0.1:3030`, network `testnet` |
| Rust reference | `aleo-backend` (snarkVM 4.5.4), `http://127.0.0.1:3031` |

Whether defect 1 still reproduces at 0.11.4 is unverified: the tester never
derives a commitment from a plaintext, so nothing in it would notice. See "Open
question".

## Defect 1 — the derived commitment is wrong (0.10.2)

For a single `credits.aleo` record minted by `credits.aleo/transfer_public_to_private`
and owned by the account under test, four commitments were compared. Ground
truth is the `id` field of the record-typed output in the block JSON.

| id | source | value |
| --- | --- | --- |
| **a** | block JSON, `output.id` | `2362040345847692437520459786169462054252722997043520815008218866762548600776field` |
| **b** | `aleo-backend`, `record_commitments[0]` | equals **a** |
| **c** | `ExecutionRequest.sign(...).input_ids()[0][0]` | `651351140051434731651432053718429910722266465586915354119071826391044599695field` |
| **d** | `RecordPlaintext.commitment(program_id, record_name, record_view_key)` | bit-identical to **c** |

`b == a`: the Rust implementation is correct.

`c == d != a`: both wasm derivations are wrong, and they are wrong *identically*
— `ExecutionRequest.sign`'s internal record-commitment derivation shares the
broken code path with `RecordPlaintext.commitment`.

Each run mints a fresh record, so absolute values differ between runs; only the
equalities are meaningful.

## Root cause: version off-by-one

The record on chain carries `_version: 0u8`. Feeding the wasm a plaintext whose
`_version` is set to `1u8` — one greater than the truth — makes
`RecordPlaintext.commitment()` reproduce the chain value exactly.

This is corroborated independently: `aleo-backend` was handed `"version": 1` in
the intent body for a record minted at version 0, and produced the correct
commitment.

Variant sweep, on a decrypted plaintext of the form

```
{
  owner: aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px.private,
  microcredits: 5000000u64.private,
  _nonce: 4827122470963772035463416099975531747567416552994282732907429943154959339462group.public,
  _version: 0u8.public
}
```

| variant | `fromString` accepts | `commitment()` | `input_ids()[0][0]` |
| --- | --- | --- | --- |
| baseline, as decrypted | yes | wrong | wrong (same value) |
| `_version → 1u8.public` | yes | **matches chain** | `null pointer passed to rust` |
| `_version` removed | yes | wrong, identical to baseline | `null pointer passed to rust` |
| `_version → 0u8.private` | **rejected** | — | — |
| `_nonce` without visibility suffix | **rejected** | — | — |
| `_nonce` bare + any `_version` variant | **rejected** | — | — |
| `_nonce` with `.private` instead of `.public` | **rejected** | — | — |

Varying `commitment()`'s own arguments does not help: `program_id="credits.aleo",
record_name="credits"` is the only accepted combination, and it yields the wrong
value. `program_id="credits"` is rejected as an invalid program name.

An absent `_version` hashes identically to `_version: 0u8`, so "missing" behaves
as version 0 while the correct result needs version 1.

## Correct and broken surfaces

| surface | commitment |
| --- | --- |
| `Transaction.fromString(json).records()[i].commitment` | correct |
| `Transaction.fromString(json).execution().transitions()[i].records()[j].commitment` | correct |
| `aleo-backend` `record_commitments[]` | correct |
| `RecordPlaintext.commitment(...)` | wrong |
| `ExecutionRequest.sign(...).input_ids()[0][0]` | wrong |

The correct surfaces read the commitment off an already-built transaction
structure. The broken ones re-derive it from a freshly parsed or decrypted
`RecordPlaintext`.

## Impact

**Signing a record input from the wasm is unusable.** A request's record input id
contains the commitment, and `Request::sign` signs a message covering the input
ids. A signature produced by `ExecutionRequest.sign` over a record input
therefore covers a request that differs from the one Rust reconstructs from the
same TLV, so `POST /transactions/authorization` cannot accept it.

**Gammas inherit the fault.** `input_ids()[0]` is
`[commitment, gamma, record_view_key, serial_number, tag]`. With a wrong
commitment, the `tag` in that tuple is wrong too, since `tag = f(sk_tag,
commitment)`. Values from one run:

```
commitment:      651351140051434731651432053718429910722266465586915354119071826391044599695field
gamma:           6158716755200031843901846051574024759777556480288873726982563020488255364349group
record_view_key: 3479577133902947634763658955397412625463304285229639532348492384049533143832field
serial_number:   1333644412904853496774343219904205921568574159680485081658767962004100267032field
tag:             6577452570262910479518626170260353057696080020735777008274267122954112927115field
```

**`request.verify()` does not detect it.** `request.verify(["credits.record",
"address.private", "u64.private"], true)` returns `true` on a request built with
the wrong commitment. It checks internal consistency, not agreement with chain
state, and is not an oracle for this defect.

**`ProgramManagerBase.executeAuthorization` cannot execute a record spend.** It
requests a state path for the commitment it derived internally:

```
GET /testnet/statePaths?commitments=<wrong commitment>field
→ 500  Commitment '<...>' does not exist
```

The devnode is not at fault — the same route returns HTTP 200 with a ~3.9 KB
`path1...` payload for the chain's real commitment. The failure surfaces only
after proof generation completes (~111 s), and arrives as a JSON decode error
because the wasm HTTP client expects JSON even on error responses.

**Production code is not affected.** `@provablehq/sdk` is a `devDependencies`
entry in `libs/coin-modules/coin-aleo`, and its only occurrence under `src/` is
`src/__tests__/helpers/account.ts`. `libs/coin-tester-modules/coin-tester-aleo`
lists it as a runtime dependency, but that package is itself a test harness.

## Defect 2 — the printed `_version` is one too low (0.11.4)

A decrypted record plaintext prints `_version: Nu8` where the chain's record
carries `N+1`. Every consumer that reads `_version` off the printed plaintext —
`aleo-backend`'s commitment derivation, and the wasm's own signing and execution
paths — therefore computes against the wrong version.

`correctRecordVersion` in `src/msw/prove.ts` patches the printed value up by one
before the plaintext is handed onward. It is unconditional: it does not detect
the defect, it assumes it.

Two live oracles pin the workaround, both in `src/scenarii.test.ts`:

| oracle | what it proves |
| --- | --- |
| `record_commitments[0]` from `POST /transactions/request` equals the chain's `output.id` | Rust reproduces the chain's real commitment from the corrected plaintext |
| `POST /transactions/authorization` accepts the resulting signature | the corrected plaintext yields a request Rust reconstructs identically |

Both go red if a future SDK release corrects the printed value, which is the
signal to drop the `+1`.

**Production `coin-aleo` is not affected.** `@provablehq/sdk` is a
`devDependencies` entry there and its only occurrence under `src/` is
`src/__tests__/helpers/account.ts`, so no shipped code path reads a wasm-printed
`_version`.

## Secondary findings

- `RecordPlaintext.fromString` **requires** an explicit `.public` / `.private`
  visibility suffix on `_nonce`. The `aleo-backend` intent body requires the
  opposite — a bare group string, because `Group::from_str` rejects a suffixed
  value.
- `RecordCiphertext.decryptWithRecordViewKey(rvk)` consumes and frees its
  `RecordViewKey` argument. Reusing that instance afterwards throws `null
  pointer passed to rust`. Derive a second instance when the value is needed
  twice.
- `RecordCiphertext.tag(graph_key, commitment)` — the `tag` accessor is on
  `RecordCiphertext`, not `RecordPlaintext`.
- `GraphKey.from_view_key(view_key)` is available, so a graph key needs no
  out-of-band derivation.
- `aleo-backend` populates `record_commitments` only when `view_key` is supplied
  in the request body.
- Commitments in devnode REST paths require the `field` suffix. Stripping it
  yields a parse error, not a lookup miss. A trailing comma in
  `?commitments=<c>field,` also breaks the parser.
- Route strings compiled into the `leo` binary: `statePath/`, `statePaths`,
  `stateRoot/latest`, `stateRoot/latesthash`. `GET /testnet/stateRoot` without a
  suffix returns 404.
- `credits.aleo/transfer_private` input types accepted by `verify()`:
  `["credits.record", "address.private", "u64.private"]`.

## Open question

Whether defect 1 still reproduces at 0.11.4, and whether any later release
corrects either defect. The cheap check is an isolated install outside the
workspace and a re-run of the a/b/c/d comparison against that copy.

A bump touches no production code. The pinned artefacts that must be re-measured
are `PUBLIC_DEVNODE_FEE_RANGE` and `PRIVATE_DEVNODE_FEE_RANGE` in
`libs/coin-tester-modules/coin-tester-aleo/src/fixtures.ts`: they bound what the
devnode charges a transaction the wasm builds, so they move with the cost table
the wasm resolves. A measured public fee of 50103 was observed at 0.10.2.

## Reproduction

Scripts, under the session scratchpad
`/tmp/claude-1000/-home-atomwoz-ledger-live/f36cfa47-f2f6-4405-9d24-02f4a9fd5839/scratchpad`:

| script | what it measures |
| --- | --- |
| `probe_abcd.mjs` | the four commitments a/b/c/d, `input_ids()[0]`, `inputTypes` discovery |
| `probe_version_variants.mjs` | the `_version` / `_nonce` variant sweep |
| `probe_surface_map.mjs`, `probe_surface_map2.mjs` | which wasm surfaces are correct |
| `probe_commitment_repro.mjs` | manual derivation vs `Transaction.records()` |
| `probe_statepath.mjs` | devnode `statePath` / `statePaths` route and encoding grid |
| `bench_transfer_public.mjs`, `bench_transfer_private.mjs` | `executeAuthorization` timing |

Each brings the docker stack up and down itself via the matching `run_*.sh`
wrapper. Docker published ports are unreachable from a sandboxed shell, so the
stack lifecycle and the node run must share one unsandboxed invocation.
