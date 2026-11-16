# Nx affected packages and paths

GitHub Action composite that runs `pnpm nx show projects --affected`, resolves each project's filesystem path via Nx, and sets outputs `packages`, `paths` and `path_prefixes` for use in workflow conditions (e.g. `contains(fromJSON(needs.determine-affected.outputs.path_prefixes), 'apps/ledger-live-desktop')`). The composite uses **actions/github-script** (no repo package.json required).

**This composite does not checkout or setup the workspace.** The caller job must run `actions/checkout` and ensure `pnpm`/`nx` are available. Pass trusted refs only for `base`/`head` (e.g. from `github.event`); do not use user-controlled input.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `base` | No | Base ref for affected calculation (e.g. `origin/main`). When omitted, Nx uses its default (e.g. from Git). |
| `head` | No | Head ref for affected calculation (e.g. `HEAD`). When omitted, Nx uses its default. |

## Outputs

| Output | Description |
|--------|-------------|
| `packages` | Newline-separated list of affected Nx project names. |
| `paths` | Newline-separated list of affected project root paths (deduplicated). |
| `path_prefixes` | JSON array of every leading segment run of the affected paths: `libs/ui/packages/react` gives `libs`, `libs/ui`, `libs/ui/packages` and `libs/ui/packages/react`. |

Gate jobs on `path_prefixes`, not `paths`. `contains()` on a string matches substrings, so `contains(paths, 'shared')` is true when only `libs/live-e2e-shared` is affected. On the parsed array it compares whole elements.

## Usage

```yaml
steps:
  - uses: actions/checkout@...
  - uses: LedgerHQ/ledger-live/tools/actions/composites/nx-affected-packages@main
    id: nx-affected
    with:
      base: origin/main
      head: HEAD
# In a later job:
# if: contains(fromJSON(needs.determine-affected.outputs.path_prefixes), 'apps/ledger-live-desktop')
```

## Script (local use)

The composite runs the Node.js script `get-affected-packages-and-paths.js`. You can run the same script locally from the repo root. It prints JSON to stdout:

```json
{"packages":["live-mobile",...],"paths":["apps/ledger-live-mobile",...],"pathPrefixes":["apps","apps/ledger-live-mobile",...]}
```

- **Base/head**: set env vars `BASE` and `HEAD` (e.g. `BASE=origin/main HEAD=HEAD`).
- **Requires**: Node.js, `pnpm`, and `nx` (no `jq` required).

### Local testing with Node.js

From the repo root (with no refs, Nx uses Git defaults):

```bash
node tools/actions/composites/nx-affected-packages/get-affected-packages-and-paths.js
```

With base/head:

```bash
BASE=origin/main HEAD=HEAD node tools/actions/composites/nx-affected-packages/get-affected-packages-and-paths.js
```

Expected: exit code 0 and valid JSON. When nothing is affected, output is `{"packages":[],"paths":[],"pathPrefixes":[]}`.

Unit tests: `node --test tools/actions/composites/nx-affected-packages/get-affected-packages-and-paths.test.js`.
