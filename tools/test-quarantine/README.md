# @ledgerhq/test-quarantine

Flake reporting for the repo's test suites. Test quarantine follows in a later phase.

A **flake** is a test that failed an attempt and passed a later one within the same run.
This package spots those and reports them to the wallet-flake-reporting ingest API, so
flakiness can be triaged from data rather than from memory.

## How it plugs in

Everything happens **in-process, through each runner's own reporter API**. Nothing here
wraps a runner, rewrites its command-line arguments, or parses its output files. That is
a deliberate constraint: argument rewriting collides with whatever the caller and the
project's config already pass, and it silently changes which tests run.

```
core/       runner-agnostic; no runner imports
  outcome     the one normalised record: a single attempt at a single test
  detect      groups attempts per test and flags fail-then-pass
  redact      strips secret-shaped text out of failure messages
  ingest      batching, retry and delivery to the ingest API
  paths       repo-relative path normalisation
  ci          CI detection and the run URL

jest/       the jest reporter
```

Only `core/redact.ts` uses regular expressions, because redaction is inherently pattern
matching. Everything else compares strings exactly.

## Enabling it for a jest package

Add the reporter to the package's jest config:

```js
reporters: [
  "default",
  "@ledgerhq/test-quarantine/jest",
],
```

and add the dependency, which is required rather than optional — the repo sets
`hoist=false`, so an undeclared import only resolves by accident:

```json
"devDependencies": { "@ledgerhq/test-quarantine": "workspace:*" }
```

**The reporter is inert until the package enables retries.** With no retries there is
never a second attempt, so a flake is indistinguishable from a hard failure:

```js
// jest.retries.js, referenced from setupFilesAfterEnv
if (process.env.CI) {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
}
```

Pass `logErrorsBeforeRetry`. Without it jest throws the failed attempt away and prints
nothing at all — the test is reported as a plain pass and the run looks clean, so the only
hint a flake happened is this tool's own output. With it, jest logs the failure and a code
frame before retrying, which is where the actual cause shows up.

**Check what else that config runs before you enable it.** Retrying a suite that talks to
third-party nodes turns a real outage green. `coin-bitcoin` is safe keyed off `CI` alone
because its integration tests live in a separate config (`jest.integ.config.js`) and are
excluded from the unit one. Where a single config serves several suites — as
`ledger-live-common` does for its unit, integration, weekly and bridge runs — gate on a flag
that only the unit run sets (an entry in its `.ci.unit.env`) instead of on `CI`.

Enabling retries is a real change to CI semantics: a flaky test starts passing the build and
gets reported instead of failing it. A test that fails every attempt still fails the build.
Roll it out per package, deliberately.

### One thing it cannot see

Flakes are grouped by `(file, full title)`, because no runner exposes a stable per-test id.
So `test.each` with a **static** title gives every case one title, and the tool cannot tell
those cases apart. It errs towards silence: a first-attempt pass is never treated as
evidence, so a hard failure in one case is never reported as a flake because a sibling
passed. The cost is that if one such case genuinely flakes, the failure text may be
attributed to a sibling. Interpolate the parameters into `each` titles
(`test.each([...])("rejects %s", …)`) and the ambiguity disappears.

## Configuration

| Variable               | Effect                                                                 |
| ---------------------- | ---------------------------------------------------------------------- |
| `CI`                   | Reporting only happens in CI. Unset locally, nothing is sent.           |
| `FLAKE_API_HOST`       | Ingest host. Reporting no-ops with a warning when unset.                |
| `FLAKE_API_KEY`        | Ingest credential. Reporting no-ops with a warning when unset.          |
| `QUARANTINE_REPO_ROOT` | Pins the root that reported paths are relative to. Discovered if unset. |

Reporting is best-effort by design: every failure path warns and continues, and total time
spent waiting on rate limits is capped for the whole run. Nothing in this package can fail
or stall a test job — `test/jest-integration.test.ts` asserts that a real jest run still
exits 0 when the ingest API returns 500, refuses the connection, or is misconfigured.

## What gets sent

Per flake: the full test title, the repo-relative file path, a retry count, the CI run URL,
and the failure text.

The failure text is processed before it leaves the machine. Runners hand over message and
stack as one string, so the stack is **cut at the first frame** and only the human-readable
part above it is kept — that is what makes "stacks are never sent" true rather than
aspirational. What remains is then denylist-redacted for secret-shaped content
(mnemonic-like word runs, long hex blobs, bech32 addresses, URLs). Redaction deliberately
over-matches: it will swallow innocent prose next to a secret rather than risk the reverse.

This policy is still provisional pending the security sign-off the PRD tracks.

The ingest endpoint is contacted by CI test tooling only, never by the shipped apps, so it
is deliberately not listed in [`docs/services.md`](../../docs/services.md) — that catalog
covers what Ledger Live Desktop and Mobile contact at runtime.

## Why the source ships as raw TypeScript

There is no build step, matching `tools/prune-changelogs`. Node 24 strips the types on
load, which works because pnpm links workspace packages as symlinks: Node resolves the
real path, which lives outside `node_modules`. Node refuses to strip types from files
whose real path *is* under `node_modules`, so a copied — rather than linked — install of
this package would fail to load the reporter. `test/jest-integration.test.ts` reproduces
the symlinked layout so this stays covered.

Two consequences for anyone editing `src/`:

- Do not use `enum`, `namespace`, or constructor parameter properties. Node's type
  stripping rejects anything that needs code generation.
- Import with explicit `.ts` extensions, as the existing files do.

## Tests

```sh
pnpm --filter @ledgerhq/test-quarantine test
```

Unit tests cover the core. `test/jest-integration.test.ts` runs a **real jest process**
against a fixture project with a genuinely flaky test, loading the real reporter through
the package's `exports`, and asserts against a stub ingest server. That test pins the
upstream behaviour the reporter depends on — that jest-circus reports each attempt
separately, with a 1-based `invocations` count — so an upstream change surfaces as a
failure here instead of silently reducing every flake to `retryCount: 0`.
