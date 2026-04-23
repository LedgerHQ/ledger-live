# Configure Nx remote cache profile

Resolves **one** IAM role ARN and the Nx S3 **`cacheKeyPrefix`** from `github.ref`, then runs [`tools/nx/write-nx-cache-config.mjs`](../../../../tools/nx/write-nx-cache-config.mjs) so **gitignored** `nx.cache-config.json` is generated with the right prefix. Tracked root [`nx.json`](../../../../nx.json) only `extends` that file and is never patched in CI.

## Edge cases

- **Pull requests:** `github.ref` is `refs/pull/<n>/merge`, so jobs use the **branch** profile (`cacheKeyPrefix: branch` and the branch OIDC role when both profile ARNs are set).
- **workflow_dispatch:** `github.ref` matches the checked-out ref. Use a dispatch against `refs/heads/develop` if you need the develop profile.
- **Legacy mode:** If OIDC role ARNs are omitted, pass `legacy-account-id` and `legacy-role-name`; the **same** role is assumed for every ref, but `cacheKeyPrefix` still follows `github.ref` (`develop` vs `branch`).

## Local workspace

After clone or when `nx.workspace.json` / `nx.s3.defaults.json` change, regenerate the cache config (also runs on `pnpm install` via `prepare`):

```bash
pnpm run nx:write-cache-config
```

If `nx.cache-config.json` already exists, the script skips overwriting it; run `pnpm run nx:write-cache-config -- --force` to regenerate after changing the tracked inputs.

`nx.cache-config.json` is gitignored; do not commit it.

## Nx activation key

CI should set `NX_KEY` (e.g. `secrets.NX_KEY` via the `setup-caches` `nx-key` input). Locally, run `pnpm exec nx register` or set `NX_KEY` in the environment. The directory `.nx/key/` is gitignored in this repo; do not commit secrets.
