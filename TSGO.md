# TSGO migration

Study branch: **`support/tsgo`** (PR e.g. [#15546](https://github.com/LedgerHQ/ledger-live/pull/15546)). Part of the work is **cherry-picked to `develop`** in small PRs (`support/cherry-tsgo-*`); the rest is validated on the tsgo branch before backport.

---

## Performance summary

Benchmark protocol: two clones on the same machine — `ll` (tsgo branch) and `ll-2` (develop). Run 1: after `git clean -xdf` + `pnpm install`, then typecheck cold/warm. Run 2: Turbo cache cleaned (`rm -rf .turbo` + all `.turbo` in workspace packages), then typecheck cold/warm with RAM. RAM = max resident set size from `/usr/bin/time -l` (macOS, run 2 only). Remote caching disabled. 159 packages in scope, 175 Turbo tasks.

**Environment:** Apple M1 Max, 10 cores · 32 GB RAM · macOS 26.2 (arm64) · Node v24.14.0 · pnpm 10.24.0 · Turbo 2.1.3.

### pnpm typecheck — average over 2 runs (Turbo “Time”) + RAM (run 2 only)

| Run | ll (tsgo) | ll-2 (develop / tsc) |
|-----|-----------|------------------------|
| **Cold** (0 cached) | **2m 41s** · 7.9 GB RAM | 3m 54s · 7.8 GB RAM |
| **Warm** (175 cached, FULL TURBO) | **9.6s** · 141 MB RAM | 9.8s · 145 MB RAM |

*Time averages: run 1 (2m45.4s / 9.3s / 4m06s / 10.7s) and run 2 (2m36.4s / 9.8s / 3m42.5s / 8.8s).*

- **Cold:** tsgo ~1m 13s faster than tsc on average; RAM comparable (~8 GB both).
- **Warm:** times and RAM in the same range (turbo replay).

---

## Already on `develop` (from tsgo cherry-picks)

Tracked via merge commits on `develop` (examples):

| PR / topic | Content |
|------------|---------|
| [#15577](https://github.com/LedgerHQ/ledger-live/pull/15577) | Turbo cache for `live-dmk-desktop` / `live-dmk-mobile` build outputs |
| [#15579](https://github.com/LedgerHQ/ledger-live/pull/15579) | CLI: externalize `hw-transport-node-hid` in rslib build |

Other tsgo-related fixes (rootDir / `tsconfig.build` layout, `baseUrl` removal, Jest `modulePaths`, LLD/LLM typecheck scripts, etc.) are **not** assumed merged until a dedicated PR lands on `develop` — most of that currently lives on **`support/tsgo`** only.

---

## Summary of adaptations for tsgo (and what can be backported to TS 5.9)

| Change | What we did | Why we had to do it | Backport on TS 5.9 without tsgo? |
|--------|-------------|---------------------|----------------------------------|
| **rootDir in tsconfigs** | Set `"rootDir": "src"` in `compilerOptions` for every package with `outDir: "lib"` and `include` containing `src`. | Without it, tsc emits under `lib/src/` (e.g. `lib/src/index.d.ts`) while `package.json` points to `lib/index.d.ts`; on clean build or CI the declarations are missing and dependents fail with “Cannot find module”. | Yes |
| **No `baseUrl` with tsgo (TS5102)** | Remove `compilerOptions.baseUrl` where tsgo errors; keep `paths` (e.g. `"*": ["./*"]` plus existing aliases). | The native/tsgo toolchain rejects `baseUrl` and suggests path mappings instead. | Optional on `tsc` only — `baseUrl` still valid in classic TypeScript. |
| **Paths without `baseUrl` (TS5090)** | For `paths` targets, use **relative** values with a `./` prefix (e.g. `"~/*": ["./src/*"]` on LLD/LLM). | Without `baseUrl`, non-relative path targets can fail typecheck. | Yes if you drop `baseUrl` elsewhere. |
| **Jest `modulePaths`** | `modulePaths: [compilerOptions.baseUrl ?? "."]` in `apps/ledger-live-desktop/jest.config.js` and `apps/ledger-live-mobile/jest.config.js`. | After removing `baseUrl`, `[undefined]` crashes Jest in `replaceRootDirInPath` (`startsWith`). | Yes |
| **LLD/LLM `scripts/typecheck.js`** | Skip filtering diagnostics when `diag.file.fileName` is not a string. | Some TS diagnostics have no file path; the filter called `fileName.startsWith` on `undefined`. | Yes |
| **Commitlint** | Conventional subject in **sentence case** (e.g. `jwt` not `JWT` in the subject line). | `subject-case` rule in CI. | N/A |
| **coin-aleo test fixture** | In `getTransactionStatus.test.ts`, for `mode: CONVERT_PRIVATE_TO_PUBLIC`, add `properties: { amountRecordCommitment: null, feeRecordCommitment: null }`. | Satisfies the discriminated union under `exactOptionalPropertyTypes`. | Yes |
| **Type annotations / casts & module declarations** | Adjustments in live-common, coin-tester, coin-bitcoin, coin-tezos, live-wallet, live-countervalues-react, ledgerjs/errors, react-ui, web-tools, etc. | Stricter inference / resolution with tsgo. | Yes (gradually) |
| **Tsconfig for tests & node types** | `types` / `tsconfig.build.json` excludes; `@types/node` where `types` includes `node`. | Tests vs publishable build. | Yes |
| **ledger-wallet-framework: export test-helpers/staticTime** | `package.json` exports pointing at source for tests. | `test-helpers/` excluded from build output; Jest consumers need resolution. | Yes (package exports only) |
| **chore: tsgo switch** | `tsgo` instead of `tsc` in build/typecheck scripts. | Compiler switch. | No (tsgo-specific) |
| **chore: VSCode** | Recommend TypeScript Native Preview / align editor with tsgo. | Editor uses the same toolchain. | No (tooling) |

---

## Related

- **CLI bundler:** native `hw-transport-node-hid` externalized (see cherry on `develop` above).
- **Sonar / coverage:** new-code coverage thresholds may require tests or exclusions; treat separately from compiler migration.
