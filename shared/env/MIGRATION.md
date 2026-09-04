# Migrating off `@shared/env` in ledger-live

The four exits and the general rules live in
[`libs/env/MIGRATION.md`](../../libs/env/MIGRATION.md) — read that first. This page is the
ledger-live-specific half: which exit each kind of variable takes *here*, and who owns the work.

> Tracking: [LIVE-36894](https://ledgerhq.atlassian.net/browse/LIVE-36894).

## API endpoints → `shared/api-services`

Backend URLs are the biggest group in the registry — `CAL_SERVICE_URL`, `LEDGER_COUNTERVALUES_API`,
`MANAGER_API_BASE`, `SWAP_API_BASE`, `STATUS_API_URL`, `PUSH_DEVICES_SERVICE_URL`, plus the long
tail of per-coin `*_API_ENDPOINT` / `API_*_NODE`.

An endpoint belongs in exactly one place: **one service per backend under
`shared/api-services/src/services/<service>/`**, following the split the repo already uses —
`shared/api-services` owns *reaching* a backend (base URL, headers, retry, reducer path),
`domain/api/*` owns *what you ask it for* (endpoints, schemas, cache tags, hooks).

The seam is already built. Each service declares its config as a zod contract read from the thunk
`extraArgument`, so the package holds no env dependency —
`shared/api-services/src/services/cal/schema.ts`:

```ts
export const CalApiExtraSchema = z.object({
  calServiceUrl: z.string().min(1),
  ledgerClientVersion: z.string().min(1),
  logger: z.custom<(...args: unknown[]) => void>().optional(),
});
```

All five apps already supply it at store configuration, so the migration is only **where the value
comes from** — the shape does not change, and `parse` fails fast at app init instead of handing you
an empty string three layers down:

```diff
  // apps/ledger-live-desktop/src/state-manager/configureStore.ts (and llm, cli, wallet-cli, web-tools)
- calServiceUrl: getEnv("CAL_SERVICE_URL"),
+ calServiceUrl: config.calServiceUrl,
```

For a backend with no service yet, add the service first — a single-use-case backend still belongs
there, so the second one is a one-line addition rather than a migration.

**Coin modules do not go through RTK Query.** A per-coin node URL reaches the module through the
`Context` threaded as the first argument (ADR-019), resolved from config the app supplies — not
through a `getCoinConfig` read on the data path. Same principle, different transport; do not reach
for `shared/api-services` there.

## Feature flags

Declare in `shared/feature-flags/src/flags/team-<yours>/` with `flag()` (no params) or `flagWith()`
(typed params), export from that folder's `index.ts`, read with `useFeature("<name>")` from
`@features/platform-feature-flags`.

> [!NOTE]
> Do **not** add it to `libs/types-live/src/feature.ts` — that file is itself deprecated in favour
> of `@shared/feature-flags`.

Often the flag already exists. `ADDRESS_POISONING_FAMILIES` duplicates
`addressPoisoningOperationsFilter`, which already carries the same list under `params.families`;
the env var is only read when the flag is off, so the exit is deleting the fallback branch:

```diff
  // libs/ledger-live-common/src/hooks/useAddressPoisoningOperationsFamilies.ts
- import { getEnv } from "@shared/env";
  import { useFeature } from "@features/platform-feature-flags";

  const addressPoisoningOperationsFilterFeature = useFeature("addressPoisoningOperationsFilter");
- const isFeatureEnabled = addressPoisoningOperationsFilterFeature?.enabled;
-
- if (!isFeatureEnabled)
-   return getEnv("ADDRESS_POISONING_FAMILIES")
-     .split(",")
-     .map((s: string) => s.trim());
-
  return addressPoisoningOperationsFilterFeature?.params?.families ?? null;
```

Only four variables are genuinely flag-shaped: `ADDRESS_POISONING_FAMILIES`,
`APTOS_ENABLE_STAKING`, `ENABLE_CELO_TOKENS` and `EXPERIMENTAL_ROI_CALCULATION`. For anything else,
check the other exits first.

## Pass the context, do not restore a singleton

The target shape is ADR-019: exported functions take the context as their first argument and
resolve config from it — no singleton reads on the data path. `getCoinConfig`/`setCoinConfig`
survive only as the compatibility surface for the classic account bridge, and that is the model for
everything else: a `setX()` is a compatibility shim, not the destination.

That applies to the network bridge too. `bridgeEnvToNetworkState()` in
`libs/ledger-live-common/src/network/setup.ts` copies **five** variables into `live-network` —
`ENABLE_NETWORK_LOGS`, `DEBUG_HTTP_RESPONSE`, `LEDGER_CLIENT_VERSION`, `GET_CALLS_TIMEOUT`,
`GET_CALLS_RETRY` — and subscribes to `changes` so the Developer-settings toggles apply without a
restart. Moving those five onto `setNetworkState` trades one global for a smaller one; it is
progress, not the end state.

Two things not to get wrong on the way:

- drop `bridgeEnvToNetworkState()` before all five have an owner and you silently lose network
  logging, HTTP-response debug and the timeout/retry config
- the two toggles are app state — the settings store owns them and pushes the current value, the
  library does not subscribe

## Escape hatches that make everything look variable

`apps/cli/src/live-common-setup-base.ts` does `for (const k in process.env) setEnvUnsafe(k, …)`,
and the dev settings can set any variable by name — LLD's `EnvVariableOverride`, LLM's `DebugEnv`
and `FeatureRow`. Neither is evidence that a value varies in a product path.

## Who owns what

Definitions are split under `shared/env/src/definitions/team-*/` and `CODEOWNERS` maps each folder
to its team. **Ownership for the migration follows the call site, not the definition** — `MOCK` is
a Platform definition read from coin-integration, wallet-xp, live-devices, qaa and ptx code. The
team holding the call site is the one that has to make the product decision.

`libs/coin-modules/*` is **already co-owned per module** in `CODEOWNERS`. Only
`coin-module-boilerplate`, `coin-bitcoin`, `coin-cosmos`, `coin-polkadot`, `coin-solana` and
`coin-tron` are coin-integration alone; every other module is shared with blockchain-support,
hoodies, blockydevs or third-party-leads.

Per-team epics hang off [LIVE-36894](https://ledgerhq.atlassian.net/browse/LIVE-36894).

## Outside this monorepo

Three repos call `injectDefinitions()` themselves and are covered by no team epic here —
`coin-modules` (`apps/coin-service`), `revault` (`packages/mobile`) and `qaa-slack-notifier`
(`fund-monitor`). They break when the package is unpublished, not before.
