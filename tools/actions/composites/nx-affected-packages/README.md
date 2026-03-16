# Nx affected packages and paths

GitHub Action composite that runs `pnpm nx show projects --affected`, resolves each project's filesystem path via Nx, and sets outputs `packages` and `paths` for use in workflow conditions (e.g. `contains(needs.determine-affected.outputs.paths, 'ledger-live-desktop')`). The composite uses **actions/github-script** (no repo package.json required).

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
# if: contains(needs.determine-affected.outputs.paths, 'ledger-live-desktop')
```

## Script (local use)

The composite runs the Node.js script `get-affected-packages-and-paths.js`. You can run the same script locally from the repo root. It prints JSON to stdout:

```json
{"packages":["live-mobile",...],"paths":["apps/ledger-live-mobile",...]}
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

Expected: exit code 0 and valid JSON. When nothing is affected, output is `{"packages":[],"paths":[]}`.
