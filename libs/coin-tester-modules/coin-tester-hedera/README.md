# @ledgerhq/coin-tester-hedera

End-to-end coin-tester scenario for the **legacy** `@ledgerhq/coin-hedera` bridge: sync → craft →
status → sign → broadcast → re-sync → assert, against a real local Hedera network, signing with a
pure-software Ed25519 key (no Speculos, no device).

## Scope

In scope: a single scenario sending 1 HBAR from a funded account to an existing account, asserting
the sender balance dropped by `value + fee` and an `OUT` operation appeared.

Out of scope (deferred): HTS/ERC20 transfers, token association, staking, memo edge cases; CI
wiring; making `coin-hedera`'s hgraph dependency optional.

## Running locally

Requires a Kubernetes >= v1.32.2 capable host (kind + kubectl + helm), 12 GB RAM / 6 CPU — Hiero
Solo (`@hiero-ledger/solo`) deploys a single-node cluster running the consensus node, mirror node,
JSON-RPC relay and explorer all as pods inside one container.

```bash
pnpm coin:tester:hedera start
```

Cold start is ~7–10 minutes; the suite's `jest.setTimeout` is raised to 20 minutes to absorb it.
`teardown` runs unconditionally after every run (deploy + destroy every time — no persistence, by
design, to match every other coin-tester package in this workspace).

## Solo's undeclared `reflect-metadata` dependency

Solo bare-imports `reflect-metadata` in its `dist/src/index.js` (it needs the polyfill for
`tsyringe-neo`'s decorator-based DI), but **no published version declares it** — 0.57.0 through
0.83.0 all omit it from `dependencies`, `peerDependencies` and `optionalDependencies`, and
`tsyringe-neo` doesn't pull it in either. It only works upstream because flat npm/yarn layouts hoist
it. Under pnpm's strict layout Solo fails immediately with `ERR_MODULE_NOT_FOUND: reflect-metadata`,
before it ever reaches the cluster.

The fix is a `pnpm.packageExtensions` entry in the **root `package.json`**, declaring the dependency
on Solo's behalf:

```json
"@hiero-ledger/solo": { "dependencies": { "reflect-metadata": "^0.2.2" } }
```

Notes for whoever touches this next:

- The key is deliberately **unversioned**. Every published version is affected, so pinning it to one
  (e.g. `@hiero-ledger/solo@0.68.0`) would make the extension silently stop applying on the next
  bump, reproducing the original error with no clue as to why.
- Root `package.json` already has a `packageExtensions` block — merge into it. Adding a second key
  of the same name is silently discarded by JSON's last-key-wins semantics.
- After editing, `rm -rf node_modules/.pnpm/@hiero-ledger+solo*` and `pnpm install --force`. A plain
  `pnpm install` reports "Lockfile is up to date" and skips re-resolving the extension.

Every failure mode above is silent, which is what makes this expensive to rediscover. The upstream
fix is a one-liner in Solo's own `package.json`; once it lands, this entry can be dropped.

## Solo leaks its port-forwards

Solo exposes the consensus node (`35211`) and mirror node (`38081`) with `--force-port-forward`,
spawning `persist-port-forward.js` / `kubectl port-forward` as **detached** processes. `solo one-shot
single destroy` tears down cluster resources only, and jest's `--forceExit` can't reach them either —
they survive every run, including green ones, reparented to init.

Left alone they don't just occupy the ports: the next run can connect to a tunnel pointing at a
deleted pod and time out, which reads as a Hedera/consensus-node failure rather than as leftover
state. That misdiagnosis is expensive.

`solo.ts` therefore calls `killPortForwards()` both before `deploy` (in case a previous run was
killed hard) and after `destroy`. It is best-effort and namespace-scoped — see the comments there for
why it targets `pgrep`/`kill` rather than the more obvious `pkill -f`. It is a no-op on Windows;
clean up by hand there if the next run can't bind. Arguably Solo's own `destroy` should do this — the
same "worth an upstream issue" caveat as `reflect-metadata` above.

## The hgraph limitation

`coin-hedera` calls the closed-source, commercial `hgraph.io` GraphQL indexer unconditionally on
every sync (`getERC20BalancesForAccountV2`, `getLatestIndexedConsensusTimestamp`). hgraph has no
open-source server and cannot be booted locally, so this package mocks it via MSW (`src/indexer.ts`)
rather than hitting a real instance. The mock is an *observer*, not a hard assertion on hgraph's
query shape — asserting that shape would couple this tester to `coin-hedera`'s internal query
pattern. The negative guarantee ("nothing external but the fake hgraph is hit") comes from the
MSW `onUnhandledRequest` throwing on any non-local, non-hgraph request.

Making hgraph optional in `coin-hedera` itself (so this mock is unnecessary) is a separate,
deferred change — see the PR description for scope.

## Unit tests for the harness itself

Unlike every sibling coin-tester, this package ships two unit tests for its own harness:
`signer.test.ts` and `indexer.test.ts`. They exist because the SDK's public-key encoding and the
hgraph `invariant` are both silent-failure modes that would otherwise only surface deep inside a
10-minute scenario run. `pnpm start`'s `src/*.test.ts` glob picks them up alongside the scenario.

## CI gap

`hedera` is listed in `.github/workflows/test-coin-tester.yml`'s `COIN_TESTER_CURRENCIES`, so it
enters the matrix — but the runner side is **not** done. Solo needs a k8s-capable runner (kind +
kubectl + helm, 12 GB RAM / 6 CPU) and `public-ledgerhq-shared-small` provides none of that, so the
job is expected to fail until it does. The `coin-tester` job sets `continue-on-error: true`, so this
does not block PRs, but it will show up as a red-but-ignored leg.

Still to do: a conditional kind/kubectl/helm install step guarded on `matrix.chain == 'hedera'`,
plus a `runs-on` swap to a larger existing runner label. Until then, `pnpm coin:tester:hedera start`
on a suitable host is the only way this actually runs green.
