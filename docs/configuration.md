---
name: configuration
description: |
  Where a configuration value belongs — feature flag, inline constant, `process.env`, app `.env`
  file, bundler define, settings slice, or a parameter the app passes in. Read before adding any
  environment variable, and when taking one out of `@shared/env` / `@ledgerhq/live-env`.
---

# Configuration

Every configuration value has exactly one home. Pick it by asking what the value _does_ and who
is allowed to see it.

> [!WARNING]
> **`@shared/env` and `@ledgerhq/live-env` are deprecated.** No new definition, no new call site,
> including in tests — in a test, set the value the way production code will read it.
> Burn-down: [LIVE-36894](https://ledgerhq.atlassian.net/browse/LIVE-36894). The rationale, and the
> cases where no exit is obvious, are on
> [live-env and environment variables](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7542833177/live-env+and+environment+variables).

## Pattern → home

| The value…                                      | Home                                                            | How it is read                                            |
| ----------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| must be flippable on a shipped release          | [feature flag](#feature-flags)                                  | `useFeature()`, or the config the composition root builds |
| never varies                                    | [inline constant](#inline-constants)                            | an import — the dependency leaves the graph               |
| only varies in dev, test or CI                  | [`process.env`](#processenv-at-the-point-of-use)                | read and parsed at the point of use                       |
| differs per released environment, and is public | [the app's `.env` file](#app-env-files)                         | `process.env.X` (desktop) / `Config.X` (mobile)           |
| is produced by the build itself                 | [a bundler define](#bundler-defines)                            | read once at boot, passed down                            |
| a human changes while the app runs              | [the app's settings slice](#the-apps-settings-slice)            | selector in the app, parameter in the lib                 |
| differs per app, or names a backend             | [a parameter the app passes in](#a-parameter-the-app-passes-in) | an argument — often a context object                      |
| is a real secret the _build_ needs              | [GitHub Secret, used by the workflow step](#build-secrets)      | never a define, never in the bundle                       |
| is a real secret the _running app_ needs        | nowhere in the client                                           | put it behind a backend                                   |

The `.env`, define, settings-slice and parameter rows all end the same way — **the app resolves
the value and passes it in** — and differ only in where the app gets it. If two rows look
plausible, take the one that removes more machinery: a constant over a flag, a parameter over a
registry.

When a value names a backend, also update [docs/services.md](./services.md).

## Feature flags

Remote, typed and audited. Declare in `shared/feature-flags/src/flags/team-<yours>/` with `flag()`
(no params) or `flagWith()` (typed params), export from that folder's `index.ts`, read with
`useFeature("<name>")` from `@features/platform-feature-flags` — see
[shared/feature-flags/README.md](../shared/feature-flags/README.md). Do **not** add it to
`libs/types-live/src/feature.ts`, which is itself deprecated.

Reach for a flag only when someone needs to flip the value on a live release. A value fixed for the
lifetime of a build is not a flag, and routing it through Firebase buys ops cost with no benefit.

Often the flag already exists and the env var is the fallback nobody deleted. `useAddressPoisoningOperationsFamilies`
is the worked example — `addressPoisoningOperationsFilter` already carries the list under
`params.families`, so the migration is deleting the fallback branch:

```diff
- import { getEnv } from "@shared/env";
-
- if (!feature?.enabled) return getEnv("ADDRESS_POISONING_FAMILIES").split(",");
  return feature?.params?.families ?? null;
```

## Inline constants

If nothing calls `setEnv` on it and no _product_ path overrides it, it is a constant that has been
paying registry rent.

```diff
- import { getEnv } from "@shared/env";
- const version = () => getEnv("API_VERSION");
+ const API_VERSION = 2;
```

Two mechanisms make _every_ variable look overridable, and neither is evidence that a value varies:
the bootstraps that loop the environment into `setEnvUnsafe` (`apps/cli/src/live-common-setup-base.ts`),
and the debug UIs that set a variable by name (desktop `EnvVariableOverride`, mobile `DebugEnv`).

## `process.env` at the point of use

Read it where you need it, parse it there, keep the default there. No registry, no injection, no
import ordering.

```diff
- import { getEnv } from "@shared/env";
- setDecimalPlaces(getEnv("DECIMAL_PLACES"));
+ const decimalPlaces = Number.parseInt(process.env.DECIMAL_PLACES ?? "", 10);
+ setDecimalPlaces(Number.isNaN(decimalPlaces) ? 40 : decimalPlaces);
```

> [!CAUTION]
> **Do not fall back with `||`.** `Number(process.env.X) || 40` is not equivalent: it swallows a
> legitimate `0`, and `false` for booleans. `intParser` returns `0` for `X=0` today, so `||`
> silently changes behaviour for anyone who set it. Test against `Number.isNaN`, or `??` over an
> already-parsed value. This is the most likely way to introduce a bug while migrating.

Where `process.env` is not populated the way it is under Node — a React Native app, a bundler
target — use that platform's accessor, and see [app `.env` files](#app-env-files) for where a
packaged build gets the value.

## App `.env` files

The home for **public configuration that differs per released environment** — Firebase and Braze
keys, Segment and Datadog RUM client tokens, partner API base URLs, hosted-UI origins, OAuth
redirect URIs, manifest ids.

The files are committed, so a change is a reviewable diff in this repo and no CI workflow needs to
learn that your feature exists.

**Desktop** — `apps/ledger-live-desktop/.env.{production,staging,testing}`. `DOTENV_FILE` in
`tools/rspack/utils.ts` picks one from `TESTING` / `STAGING` / `NODE_ENV`, and
`buildDotEnvDefine()` turns every key into a `process.env.KEY` replacement on all rspack targets.
Read it as the literal expression:

```ts
const hostedUi = process.env.CARD_BAANX_HOSTED_UI;
```

No `.env` is committed, so a plain `pnpm desktop start` gets no values — keep a default at the
use site. Only a literal `process.env.X` is substituted; a dynamic lookup such as
`process.env[name]` or a `for…in` over `process.env` sees nothing.

`__BUILD_ENVS__` is the legacy bridge around that: a hand-maintained `BUILD_ENV_NAMES` allowlist in
the same file, merged into `process.env` at boot by `src/renderer/env.ts`, for the values the app
still reads through `getEnv`/`useEnv`. Read the literal expression and no allowlist has to learn
your key.

**Mobile** — `apps/ledger-live-mobile/.env.<platform>.<variant>`, selected by `ENVFILE`
(the fastlane lane files under `apps/ledger-live-mobile/fastlane/.env.*`). Read it through
`react-native-config`:

```ts
import Config from "react-native-config";
const hostedUi = Config.CARD_BAANX_HOSTED_UI;
```

The `CARD_BAANX_*` / `CARD_OAUTH_REDIRECT_URI` group is the worked example of getting this wrong.
Reading them through `getEnv`/`useEnv` put them out of `buildDotEnvDefine()`'s reach, so each name
needs its own `BUILD_ENV_NAMES` entry to arrive in the renderer at all — and their values went to
GitHub Secrets plus a `ledger-live-build` workflow edit per feature. Nothing else needs to follow.

> [!IMPORTANT]
> Everything in these files is compiled into the artifact and readable by anyone holding the
> binary. Public configuration only. That it looks like a token does not make it a secret —
> a Datadog RUM `pub…` token and a Firebase web API key are meant to ship; a Datadog _API_ key
> and a signing key are not.

Add the key to **every** `.env` file for that app, so no environment silently falls back to a
default.

## Bundler defines

A value the build itself produces — version, commit, target — is a define, read once at boot and
passed down. `__APP_VERSION__` → `ledgerClientVersion` → the store's `extraArgument` is already the
pattern; the `setEnv("LEDGER_CLIENT_VERSION", …)` in the middle is the part to delete.

## Build secrets

A genuine secret the build needs — a signing key, a source-map upload token — stays in a GitHub
Secret consumed by the workflow step that uses it. It never becomes a define, never lands in a
`.env` file and never reaches app code: **everything handed to the bundler ships inside the
artifact**, so nothing compiled into the app can be secret.

The named-define pattern is for a build-time value that is safe to ship but must not be merged into
`process.env` wholesale. Desktop's `UPDATE_CHECK_PUBKEY` is that case — a _public_ verification
key, passed on the build step and emitted as `__UPDATE_CHECK_PUBKEY__` by `buildMainEnv()`, with a
committed fallback in `src/main/updater/ledger-pubkey.ts`.

Mobile has a second pattern worth copying: the committed file names _which_ secret to use rather
than holding it — `DATADOG_CLIENT_TOKEN_VAR="DATADOG_PROD_CLIENT_TOKEN"` in `.env.android.release`,
resolved in `src/datadog.ts`.

**Keep the two layers apart:**

- `.env.*` is public app config. CI must not append to it, and
  [ledger-live-build](https://github.com/LedgerHQ/ledger-live-build) must not need a change to
  ship a feature's configuration.
- A build secret stays in the workflow step. If a value has to reach app code at all, it is not a
  secret — treat it as public config and pick its home from the table above.

Mixing them is how a secret ends up in a client bundle: once a workflow writes secrets into the
same file the app reads wholesale, only the choice of variable name stands between the two.

> [!NOTE]
> Known debt: the mobile release workflows append `DATADOG_*_APPLICATION_ID` and
> `DATADOG_*_CLIENT_TOKEN` to the committed `.env.<platform>.<variant>`. Those particular values
> are client-side RUM credentials and safe to ship, but the mechanism is the one described above
> — do not extend it.

## The app's settings slice

**Anything a human can change while the app runs is app state, and app state lives in the app's
store.** Ask who turns the knob:

| Who changes it                   | Where                                   | Source of truth                         |
| -------------------------------- | --------------------------------------- | --------------------------------------- |
| Product / ops, on a live release | Firebase                                | feature flag                            |
| The end user                     | Settings — designed, translated         | the settings slice                      |
| Us (dev / QA), per install       | Developer settings, behind the dev gate | the settings slice, developer namespace |
| Us, at launch or in CI           | the shell / `ENVFILE`                   | `process.env` at the use site           |

If none of those four is a real audience, the value is not dynamic — it is a constant or a dev-only
`process.env` read.

There is no generic developer-settings slice yet to replace desktop's `EnvVariableOverride` and
mobile's `DebugEnv` / `experimental.ts`. Until one exists:

- **If the value already has a settings entry, the slice is the source of truth and the env write
  is a bridge to delete.** `HIDE_EMPTY_TOKEN_ACCOUNTS` and `FILTER_ZERO_AMOUNT_ERC20_EVENTS` are
  exactly this: Redux already owns them, and `setEnvOnAllThreads` only exists so a lib can read
  them through a global. Pass the value instead.
- **If it does not, add one typed field to the app's settings slice** and one purpose-built row in
  Developer settings, then pass it down from the composition root.
- **Do not add a definition to get a free row in the generic debug UI.** That is the single biggest
  reason the registry grew to ~200 entries.

Losing "set any variable by name" is intended. Per-feature developer rows are also what QA actually
wants — discoverable, typed, documented.

## A parameter the app passes in

The app knows things a library cannot. Take the value as an argument; do not store it. Where several
values travel together, group them into one context object threaded as the first argument (ADR-019).

```diff
  // library
- import { getEnv } from "@shared/env";
-
- export function fetchThing(id: string) {
-   return request(`${getEnv("API_URL")}/things/${id}`);
- }
+ export function fetchThing(ctx: { apiUrl: string }, id: string) {
+   return request(`${ctx.apiUrl}/things/${id}`);
+ }
```

The signature is the whole point: a caller cannot forget the value, a test supplies a different one
without touching global state, and two callers can use two different values at the same time — none
of which a singleton allows. Replacing `getEnv` with a module-level `let` and a `configure()` is the
same anti-pattern one size down; a `setX()` is a compatibility shim, never the destination.

**Backend URLs go to `shared/api-services`.** Do not inline an endpoint where the `getEnv` used to
be — that scatters one backend's address across every file that talks to it. One service per backend
under `shared/api-services/src/services/<service>/`: `shared/api-services` owns _reaching_ a backend
(base URL, headers, retry, reducer path), `domain/api/*` owns _what you ask it for_ (endpoints,
schemas, cache tags, hooks). Each service declares its config as a zod contract read from the thunk
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
comes from** — and `parse` fails fast at app init instead of handing you an empty string three
layers down:

```diff
  // apps/ledger-live-desktop/src/state-manager/configureStore.ts (and llm, cli, wallet-cli, web-tools)
- calServiceUrl: getEnv("CAL_SERVICE_URL"),
+ calServiceUrl: config.calServiceUrl,
```

`_STAGING`/`_PROD` pairs are not two endpoints: they are one endpoint and an app-level choice of
which URL to pass — and that chosen value lives in the app's [`.env` file](#app-env-files).

**Coin modules do not go through RTK Query.** A per-coin node URL reaches the module through the
`Context` threaded as the first argument, resolved from config the app supplies — not through a
`getCoinConfig` read on the data path. Same principle, different transport.

## Adding a new value

1. Pick a row in the table. If two look plausible, take the one that removes more machinery.
2. If it is per-environment app config, add it to **every** `.env` file for that app.
3. Read it at the point of use with a default, or resolve it once at store configuration and pass
   it down. Do not add a `@shared/env` definition.
4. Update [docs/services.md](./services.md) if it points at a backend.

## Migrating an existing variable

- **Remove the definition in the same PR.** A definition with zero call sites left is dead weight
  nobody comes back for; one with no call sites anywhere is a deletion, not a migration.
- **Ownership follows the call site, not the definition.** Definitions are split under
  `shared/env/src/definitions/team-*/` with `CODEOWNERS` mapping each folder to a team, but `MOCK`
  is a Platform definition read from coin-integration, wallet-xp, live-devices, qaa and ptx code —
  the team holding the call site makes the product decision. Per-team epics hang off
  [LIVE-36894](https://ledgerhq.atlassian.net/browse/LIVE-36894).
- **Migrate a whole bridge, not one key.** `bridgeEnvToNetworkState()` in
  `libs/ledger-live-common/src/network/setup.ts` copies five variables into `live-network` —
  `ENABLE_NETWORK_LOGS`, `DEBUG_HTTP_RESPONSE`, `LEDGER_CLIENT_VERSION`, `GET_CALLS_TIMEOUT`,
  `GET_CALLS_RETRY`. Drop the call before all five have an owner and you silently lose network
  logging, HTTP-response debug and the timeout/retry config.
- **Outside this monorepo**, three repos call `injectDefinitions()` themselves and are covered by no
  team epic here — `coin-modules` (`apps/coin-service`), `revault` (`packages/mobile`) and
  `qaa-slack-notifier` (`fund-monitor`). They break when the package is unpublished, not before.
- **If no home fits**, raise it on [LIVE-36894](https://ledgerhq.atlassian.net/browse/LIVE-36894)
  rather than inventing one, and leave the variable where it is meanwhile — a half-migration into a
  lib-level `let` + `configure()` is still global and still mutable, and now there are two of them.
