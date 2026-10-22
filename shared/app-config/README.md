# @shared/app-config

> [!CAUTION]
> **Status: UNSTABLE** — In active development for [ADR-0001 runtime configuration overrides](https://ledgerhq.atlassian.net/browse/LIVE-38076); API may change.

Resolves the configuration of an app session once, before the store builds the Redux thunk
`extraArgument`. Each app wraps `resolveAppConfig` in a pure `loadAppConfig(storage, profile)`, next
to a pure `profileOf` that derives the profile from the build (`apps/*/src/setup/load.ts`). Its
`apps/*/src/setup/session.ts` binds the storage and profile of the session:

- **Desktop** exports `loadAppConfig(storage?)`, which the store factory calls when the store is
  created, never at module level. Playwright runs seed `localStorage` in `init()`, after the modules
  are evaluated, and pass the selections of `PLAYWRIGHT_RUN.appConfig` as a static storage.
- **Mobile** exports `appConfig`, resolved when the module is evaluated: MMKV and the launch
  arguments are both read synchronously. Detox builds read the selections from the `appConfig`
  launch argument (a JSON string) instead of MMKV.

- A **switch** is a closed set of option groups that the build declares, one per option id
  (`prod`, `staging`). Selecting an option moves all its values together and never accepts a value
  the build did not declare.
- The **selections** are the option id of each switch, read once and synchronously at boot from the
  app's `ConfigStorage` (`apps/*/src/setup/storage.ts`): JSON under the `appConfigSelections`
  `localStorage` key on desktop, one key per switch in a dedicated MMKV instance on mobile. A switch
  without a selection resolves to the default. If the storage holds anything else than option ids,
  or cannot be read, `resolveAppConfig` clears it and every switch resolves to the default, so a
  tampered selection never fails the boot.
- The **default** option is passed once for every switch. It is the `CONFIG_PROFILE` of the build's
  `.env` file: `staging` for dev, adhoc and nightly builds, `prod` for prerelease and release
  builds. Dev builds commit no `.env` file, so the desktop build script defines `staging` in
  development mode, and mobile falls back to `staging` when `__DEV__` is true. A local `.env` can
  still set another profile. Any value other than `staging`, or none, is `prod`.
- **Fixed** values have one value per build.
- The **schema** declares, in zod, the values of each switch and the fixed values.
  `defineConfigSchema` hands zod to a callback, so apps write plain zod without depending on it.
  A value name must be unique across switches and fixed values.
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
export const loadAppConfig = (storage: ConfigStorage, profile: "prod" | "staging") =>
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
debug tool that changes one saves it and asks for a reload. Only Keycloak reads the configuration so
far: the other services keep their `@shared/env` reads until they move to it.

## Exports

| Export                      | Purpose                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `defineConfigSchema`        | Declares the value schemas of each switch and of the fixed values |
| `resolveAppConfig`          | Resolves and parses the configuration of one session, frozen      |
| `InvalidConfigOptionError`  | An option of a switch fails the schema of that switch             |
| `DuplicateConfigValueError` | A value name is declared more than once in the schema             |
| `ConfigSchema`              | Type of what `defineConfigSchema` returns                         |
| `ConfigSchemaSwitches`      | Type of the value schemas of each switch, by switch id            |
| `ConfigSwitch`              | Type of one switch: label and options                             |
| `ConfigOptionId`            | Type of an option id: `prod` or `staging`                         |
| `ConfigOptions`             | Type of the options of a switch, typed by its shape               |
| `ConfigStorage`             | Type of the storage the app persists the selections in            |
| `AppConfig`                 | Type of the configuration a schema describes                      |
| `Zod`                       | Type of the zod namespace the callback receives                   |

Apps reach zod only through `defineConfigSchema`, and do not declare it. Its API is still part of
their schemas, a deliberate exception to "hide the lib" in
[wrap-third-party-libs](../../.agents/skills/wrap-third-party-libs/SKILL.md): zod is the repo's
schema library, and swapping it would touch the app schemas only.
