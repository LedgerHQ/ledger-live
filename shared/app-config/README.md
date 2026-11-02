# @shared/app-config

> [!CAUTION]
> **Status: UNSTABLE** — In active development for [ADR-0001 runtime configuration overrides](https://ledgerhq.atlassian.net/browse/LIVE-38076); API may change.

Resolves the configuration of an app session once, before the store is created. Each app wraps `resolveAppConfig` in a pure `loadAppConfig(storage, profile)`, next
to a pure `profileOf` that derives the profile from the build (`apps/*/src/setup/load.ts`). Its
`apps/*/src/setup/session.ts` binds the storage and profile of the session:

- **Desktop** exports `loadAppConfig(storage?)`, which the store factory calls when the store is
  created, never at module level. Playwright runs seed `localStorage` in `init()`, after the modules
  are evaluated, and pass the selections of `PLAYWRIGHT_RUN.appConfig` as a static storage.
- **Mobile** exports `appConfig` and `appConfigSession`, resolved when the module is evaluated: MMKV
  and the launch arguments are both read synchronously. Detox builds read the selections from the
  `appConfig` launch argument (a JSON string) instead of MMKV.

- A **switch** is a closed set of option groups that the build declares, one per option id
  (`prod`, `staging`). Selecting an option moves all its values together and never accepts a value
  the build did not declare.
- **Dev** (`dev`) is a third selection, on staging-default builds only: a switch or a fixed value on
  Dev runs on values typed in the devtool. See [Dev values](#dev-values).
- The **selections** are what each switch selects, and `dev` for each fixed value on Dev, read once
  and synchronously at boot from the `selections` of the app's `AppConfigStorage`
  (`apps/*/src/setup/storage.ts`): JSON under the `appConfigSelections` key, in `localStorage` on
  desktop and in the `app-config` MMKV instance on mobile, both built with `jsonConfigStorage`. A
  switch without a selection resolves to the default. A selection the session cannot make, such as
  one of an undeclared switch, is ignored and stays stored. If the storage holds anything else than
  selection ids, or cannot be read, `resolveAppConfig` clears it and every switch resolves to the
  default, so a tampered selection never fails the boot.
- The **default** option is passed once for every switch. It is the `CONFIG_PROFILE` of the build's
  `.env` file: `staging` for dev, adhoc and nightly builds, `prod` for prerelease and release
  builds. Dev builds commit no `.env` file, so the desktop build script defines `staging` in
  development mode, and mobile falls back to `staging` when `__DEV__` is true. A local `.env` can
  still set another profile. Any value other than `staging`, or none, is `prod`.
- **Fixed** values have one value per build, which only Dev overrides.
- The **schema** declares, in zod, the values of each switch and the fixed values.
  `defineConfigSchema` hands zod to a callback, so apps write plain zod without depending on it.
  A value name must be unique across switches and fixed values, and a switch id must not be the
  name of a fixed value, since their selections share one storage.
- `resolveAppConfig` takes its types from the schema: every option of a switch has that switch's
  shape, and the fixed values have the fixed shape. At boot, every option of every switch is
  parsed with its switch schema, selected or not, so a broken option fails in every build with an
  `InvalidConfigOptionError` naming it. The merged values are then parsed strictly.
- Values are resolved once per session. Changing one takes a reload, by design: see
  [Changes take a reload](#changes-take-a-reload).

```ts
// apps/*/src/setup/schema.ts
export const appConfigSchema = defineConfigSchema(z => ({
  switches: {
    ledgerKeyRing: { keycloakBaseUrl: z.url({ protocol: /^https?$/ }) },
  },
  fixed: {
    keycloakClientId: z.string().min(1),
    keycloakRealm: z.string().min(1),
  },
}));

// apps/*/src/setup/load.ts
export const loadAppConfig = (storage: AppConfigStorage, profile: "prod" | "staging") =>
  resolveAppConfig({
    schema: appConfigSchema,
    storage,
    default: profile,
    switches: {
      ledgerKeyRing: {
        label: "Ledger Key Ring backends",
        options: {
          prod: { keycloakBaseUrl: "https://global.api.prd.ledger.com/keycloak" },
          staging: { keycloakBaseUrl: "https://global.api.stg.ledger-test.com/keycloak" },
        },
      },
    },
    fixed: {
      keycloakClientId: "ledger-keycloak",
      keycloakRealm: "ledger-bc-customers",
    },
  });

// apps/ledger-live-desktop/src/setup/session.ts
export const loadAppConfig = (storage = appConfigStorage) =>
  load(storage, profileOf(process.env.CONFIG_PROFILE));

// apps/*/src/state-manager/configureStore.ts
authProvider: new AuthSDK(
  {
    clientId: appConfig.keycloakClientId,
    keycloakBaseUrl: appConfig.keycloakBaseUrl,
    keycloakRealm: appConfig.keycloakRealm,
    disablePkce: true,
  },
  { provider },
),
// …
.concat(
  createAppConfigMiddleware({
    session: appConfigSession,
    reload: () => window.api?.reloadRenderer(),
  }),
)
```

## Changes take a reload

The configuration never changes while the app runs. A new selection, `.env` value or debug override
applies from the next session: a window reload on desktop, an app restart on mobile. This is a
choice, not a limitation to work around:

- Switching a backend while the app runs leaves part of the app on the old one: requests in flight,
  cached responses, sessions and tokens the old backend issued, and every value another module read
  before the switch. What happens next depends on timing, so nobody can predict it.
- A reload starts every module from the same configuration, so a session talks to one consistent
  set of backends.

So the store never re-reads a configuration value on a request to follow a runtime change, and a
debug tool that changes one saves it, then reloads when the developer asks: a reload can be slow
under a debugger or on an emulator, so several changes take a single one. Only Keycloak reads the configuration so
far: the other services keep their `@shared/env` reads until they move to it.

## Selecting an option

`resolveAppConfig` returns the configuration as `config`, and what it was resolved from as
`session`: the declared switches, the default option, the selections read at boot and the storage.
Each store hands `session` to `createAppConfigMiddleware`, with the `reload` that starts the next
session. The storage and the reload are dependencies, so they stay in the middleware's closure
rather than in the thunk `extraArgument`, which only carries config.

- Once the store is created, the middleware sets the `appConfig` slice to the session without its
  storage, and its saved selections to the ones read at boot. Register `appConfigReducer` under
  `state.appConfig`; `appConfigSessionSelector` returns `null` until then.
- `selectAppConfigOption` saves what a declared switch or fixed value selects, in the slice and
  with `ConfigStorage.set`. `resetAppConfigSelection` removes its selection, in the slice and with
  `ConfigStorage.remove`, so the next session follows the default. Any other id or selection id is
  ignored, and so is `dev` on a prod-default build. Neither reloads: the session keeps running on
  the selections it booted with, and `appConfigSavedSelectionsSelector` returns the ones the next
  session resolves from.
- `setAppConfigDevValue` and `removeAppConfigDevValue` do the same for dev values, which
  `appConfigSavedDevValuesSelector` returns.
- `reloadAppConfig` calls `reload`, which starts the next session.

The `app-config` devtool reads the slice and dispatches these actions through
`useAppConfigToolProps()` from `@devtools/bindings`.

## Dev values

A build whose default option is staging (dev, staging, nightly, testing and mock builds) also
accepts dev values: values no build declares, such as the URL of a local server.

- Dev values are strings by value name, in the `devValues` storage: JSON under the
  `appConfigDevValues` key, next to the selections. They stay stored when Dev is not selected, so
  selecting Dev again brings them back.
- `resolveAppConfigValues` applies them: a switch on Dev runs on its default option's values with
  its own dev values on top, and a fixed value on Dev on its dev value. The devtool binding uses it
  too, to show what this session and the next one run on.
- The schema of a value parses its dev value twice. The middleware parses it on
  `setAppConfigDevValue`, and records a refused one in `appConfigDevValueErrorsSelector` instead of
  saving it. `resolveAppConfig` parses it at boot, and ignores an invalid or unknown one, so a dev
  value never fails the boot.
- A prod-default build ignores Dev: it never reads the dev values, its selections holding `dev` are
  ignored and stay stored, and its middleware and slice ignore `dev`. Its devtool offers no Dev, so
  nothing sets a dev value there, and one set anyway is never read. The desktop build defines
  `CONFIG_PROFILE` in every mode, `prod` outside development, so a packaged build never takes it
  from the launch environment.
- E2E runs pass dev values next to the selections through `readOnlyConfigStorage`:
  `PLAYWRIGHT_RUN.appConfigDevValues` on desktop, the `appConfigDevValues` launch argument on Detox
  builds. Detox flavours built from `.env.mock.prerelease` default to prod, so they ignore them.

## Exports

| Export                             | Purpose                                                           |
| ---------------------------------- | ----------------------------------------------------------------- |
| `defineConfigSchema`               | Declares the value schemas of each switch and of the fixed values |
| `resolveAppConfig`                 | Resolves and parses the configuration of one session, frozen      |
| `createAppConfigMiddleware`        | Sets the `appConfig` slice, saves selections, reloads on request  |
| `resolveAppConfigValues`           | Resolves every value from selections and dev values, unparsed     |
| `selectAppConfigOption`            | Action: saves what a switch or a fixed value selects              |
| `resetAppConfigSelection`          | Action: removes the selection of a switch or a fixed value        |
| `setAppConfigDevValue`             | Action: saves the dev value of a value, once parsed               |
| `removeAppConfigDevValue`          | Action: removes the dev value of a value                          |
| `reloadAppConfig`                  | Action: starts the next session                                   |
| `appConfigReducer`                 | Reducer of the `appConfig` slice                                  |
| `appConfigSessionSelector`         | The session of the `appConfig` slice, or `null` until it is set   |
| `appConfigSavedSelectionsSelector` | The selections the next session resolves from                     |
| `appConfigSavedDevValuesSelector`  | The dev values the next session resolves from                     |
| `appConfigDevValueErrorsSelector`  | The last refused dev value of each value, and why                 |
| `jsonConfigStorage`                | A storage holding its entries as JSON in one persisted string     |
| `readOnlyConfigStorage`            | A storage that only reads, for e2e runs                           |
| `APP_CONFIG_OPTION_IDS`            | The id of each option every switch declares, in display order     |
| `InvalidConfigOptionError`         | An option of a switch fails the schema of that switch             |
| `DuplicateConfigValueError`        | A value name is declared more than once in the schema             |
| `DuplicateConfigIdError`           | A switch id is the name of a fixed value                          |
| `ConfigSchema`                     | Type of what `defineConfigSchema` returns                         |
| `ConfigSchemaSwitches`             | Type of the value schemas of each switch, by switch id            |
| `ConfigSwitch`                     | Type of one switch: label and options                             |
| `ConfigSwitches`                   | Type of the switches an app declares, whatever their values       |
| `ConfigOptionId`                   | Type of an option id: `prod` or `staging`                         |
| `ConfigSelectionId`                | Type of what a switch or a fixed value selects: an option, or dev |
| `ConfigOptions`                    | Type of the options of a switch, typed by its shape               |
| `ConfigStorage`                    | Type of one storage: the selections, or the dev values            |
| `AppConfigStorage`                 | Type of the two storages `resolveAppConfig` reads                 |
| `StorageKey`                       | Type of one persisted key, which `jsonConfigStorage` holds        |
| `AppConfigDeclarations`            | Type of what a session declares: switches, fixed values, default  |
| `RejectedDevValue`                 | Type of a dev value the middleware refused, and why               |
| `AppConfig`                        | Type of the configuration a schema describes                      |
| `AppConfigSession`                 | Type of what a configuration was resolved from: its `session`     |
| `AppConfigMiddlewareConfig`        | Type of what `createAppConfigMiddleware` takes                    |
| `AppConfigState`                   | Type of the `appConfig` slice                                     |
| `Zod`                              | Type of the zod namespace the callback receives                   |

Apps reach zod only through `defineConfigSchema`, and do not declare it. Its API is still part of
their schemas, a deliberate exception to "hide the lib" in
[wrap-third-party-libs](../../.agents/skills/wrap-third-party-libs/SKILL.md): zod is the repo's
schema library, and swapping it would touch the app schemas only.
