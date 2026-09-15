---
name: configuration
description: |
  Where a configuration value belongs — feature flag, app `.env` file, inline constant,
  `process.env`, or a build secret. Read before adding any new environment variable.
---

# Configuration

Every configuration value has exactly one home. Pick it by asking what the value _does_ and
who is allowed to see it.

| The value…                                          | Home                                     |
| --------------------------------------------------- | ---------------------------------------- |
| must change without shipping a release              | [feature flag](#feature-flags)           |
| differs per released environment, and is public     | [the app's `.env` file](#app-env-files)  |
| never varies                                        | inline constant                          |
| only varies in dev, test or CI                      | `process.env` at the point of use        |
| is a real secret the _build_ needs                  | [GitHub Secret](#build-secrets)          |
| is a real secret the _running app_ needs            | nowhere in the client — put it behind a backend |

Two things that are **not** homes: `@shared/env` is
[deprecated](../shared/env/MIGRATION.md) and takes no new definitions, and a feature flag is
not a substitute for a per-environment constant just because it happens to be writable.

When a value names a backend, also update [docs/services.md](./services.md).

## Feature flags

Remote, typed and audited. Declare in `shared/feature-flags/src/flags/team-<yours>/`, read with
`useFeature()` — see [shared/feature-flags/README.md](../shared/feature-flags/README.md).

Reach for a flag when someone needs to flip the value on a live release. A value that is fixed
for the lifetime of a given build is not a flag, and routing it through Firebase buys ops cost
with no benefit.

## App `.env` files

This is the home for **public configuration that differs per released environment** —
Firebase and Braze keys, Segment and Datadog RUM client tokens, partner API base URLs, hosted-UI
origins, OAuth redirect URIs, manifest ids.

The files are committed, so a change is a reviewable diff in this repo and no CI workflow needs
to learn that your feature exists.

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

**Mobile** — `apps/ledger-live-mobile/.env.<platform>.<variant>`, selected by `ENVFILE`
(the fastlane lane files under `apps/ledger-live-mobile/fastlane/.env.*`). Read it through
`react-native-config`:

```ts
import Config from "react-native-config";
const hostedUi = Config.CARD_BAANX_HOSTED_UI;
```

> [!IMPORTANT]
> Everything in these files is compiled into the artifact and readable by anyone holding the
> binary. Public configuration only. That it looks like a token does not make it a secret —
> a Datadog RUM `pub…` token and a Firebase web API key are meant to ship; a Datadog _API_ key
> and a signing key are not.

## Build secrets

A genuine secret the build needs — a signing key, a source-map upload token — lives in a GitHub
Secret and reaches the bundler as **its own named define**, so it lands only where it is used.
Desktop's `UPDATE_CHECK_PUBKEY` is the pattern: passed on the build step, emitted as
`__UPDATE_CHECK_PUBKEY__` by `buildMainEnv()`, never merged into `process.env`.

Mobile has a second pattern worth copying: the committed file names _which_ secret to use rather
than holding it — `DATADOG_CLIENT_TOKEN_VAR="DATADOG_PROD_CLIENT_TOKEN"` in
`.env.android.release`, resolved in `src/datadog.ts`.

**Keep the two layers apart:**

- `.env.*` is public app config. CI must not append to it, and
  [ledger-live-build](https://github.com/LedgerHQ/ledger-live-build) must not need a change to
  ship a feature's configuration.
- A GitHub Secret reaches the build through a named define, never through a `.env` file and never
  through `process.env`.

Mixing them is how a secret ends up in a client bundle: once a workflow writes secrets into the
same file the app reads wholesale, only the choice of variable name stands between the two.

> [!NOTE]
> Known debt: the mobile release workflows append `DATADOG_*_APPLICATION_ID` and
> `DATADOG_*_CLIENT_TOKEN` to the committed `.env.<platform>.<variant>`. Those particular values
> are client-side RUM credentials and safe to ship, but the mechanism is the one described above
> — do not extend it.

## Adding a new value

1. Pick a row in the table. If two look plausible, take the lower one — it removes more machinery.
2. If it is per-environment app config, add it to **every** `.env` file for that app, so no
   environment silently falls back to a default.
3. Read it at the point of use with a default, or resolve it once at store configuration and pass
   it down. Do not add a `@shared/env` definition.
4. Update [docs/services.md](./services.md) if it points at a backend.
