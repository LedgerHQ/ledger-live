# Nx Environment Variables Analysis

Analysis of turbo.json `globalEnv` vars by app scope (desktop vs mobile vs shared) and usage context (dev/debug vs test vs release).
Source: `apps/ledger-live-desktop`, `apps/ledger-live-mobile`, `.github/workflows`, `tools/`.

**Note**: Mobile uses `Config.<VAR>` (react-native-config) and `getEnv()` which read from `.env` files.

**Context legend**: **Dev** = local development | **Test** = CI/E2E | **Live** = runtime in production (Firebase, Braze, Sentry, etc.) | **Release** = build/signing/upload

---

## By App Scope

### Desktop-only (ledger-live-desktop)

| Var                                                         | Usage                                   | Context                                 |
| ----------------------------------------------------------- | --------------------------------------- | --------------------------------------- |
| APPLECONNECT*API_KEY*\*                                     | App Store Connect API (CI)              | Release                                 |
| APPLEID, APPLEID_PASSWORD                                   | macOS notarization (notarize.js)        | Release                                 |
| DEVELOPER_TEAM_ID                                           | macOS notarization                      | Release                                 |
| AZURE_APP_ID, AZURE_TENANT_ID, AZURE_SECRET, AZURE_KEY_NAME | Windows code signing                    | Release                                 |
| CI_KEYCHAIN_NAME, CI_KEYCHAIN_PASSWORD                      | macOS CI keychain                       | Release                                 |
| MATCH_PASSWORD, FASTLANE_PASSWORD                           | iOS/mac signing (CI)                    | Release                                 |
| ELECTRON_ARGS                                               | main-rspack.ts                          | **Dev**                                 |
| DEV_TOOLS, DISABLE_DEV_TOOLS, BYPASS_CORS                   | window-lifecycle.ts                     | **Dev**                                 |
| GENERATE_METAFILES                                          | main-rspack.ts (build)                  | Build                                   |
| SENTRY_URL, SENTRY_AUTH_TOKEN                               | tools/dist, rspack utils                | Release                                 |
| FIREBASE\_\*                                                | firebase-setup.ts, FirebaseRemoteConfig | **Live** (Remote Config, feature flags) |
| BRAZE_API_KEY, BRAZE_CUSTOM_ENDPOINT                        | braze-setup.ts                          | **Live**                                |

### Mobile-only (live-mobile)

| Var                                                         | Usage                                             | Context                                                         |
| ----------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| ANDROID_HOME, ANDROID_SDK_ROOT                              | Android build                                     | Release                                                         |
| ANDROID*KEYSTORE*\*, ANDROID_KEY_ALIAS, ANDROID_KEY_PASS    | Android signing                                   | Release                                                         |
| APP_IDENTIFIER, APP_NAME, MY_APP_BUNDLE_ID, SHORT_BUNDLE_ID | iOS/Android app config                            | Release                                                         |
| BRAZE_ANDROID_API_KEY, BRAZE_IOS_API_KEY                    | Platform-specific Braze keys                      | **Live**                                                        |
| DATADOG\_\*                                                 | datadog.ts, .env files                            | **Live**                                                        |
| Firebase (native)                                           | @react-native-firebase (messaging, remote-config) | **Live** (push, feature flags; config via google-services.json) |
| ENVFILE                                                     | react-native-config, detox builds                 | Build/Test                                                      |
| SUPPLY_UPLOAD_MAX_RETRIES                                   | Play Store upload                                 | Release                                                         |

### Shared (both apps)

| Var                                                     | Usage                           | Context        |
| ------------------------------------------------------- | ------------------------------- | -------------- |
| MOCK, MOCK_COUNTERVALUES, MOCK_REMOTE_LIVE_MANIFEST     | Mock mode                       | **Dev + Test** |
| ENABLE_MSW                                              | MSW (start:msw script)          | **Dev + Test** |
| DEBUG\_\*, HIDE_DEBUG_MOCK, DISABLE_MOCK_POINTER_EVENTS | Debug toggles, Playwright specs | **Dev + Test** |
| OVERRIDE_MODELID, OVERRIDE_MODEL_ID                     | Device override                 | Dev            |
| DEFAULT_EARN_MANIFEST_ID, DEFAULT_SWAP_MANIFEST_ID      | PTX manifests                   | Dev/Release    |
| SPECULOS_API_PORT, SPECULOS_DEVICE                      | Speculos                        | Dev/Test       |
| DISABLE_TRANSACTION_BROADCAST, SHOW_ETHEREUM_BRIDGE     | Feature flags                   | Dev            |
| USBTROUBLESHOOTING_PLATFORM                             | USB                             | Dev            |
| NO*DEBUG*\*                                             | Logger toggles                  | Dev            |
| ANALYTICS*TOKEN, GH_TOKEN, GIT_REPO*\*                  | Generic CI                      | CI             |
| SENTRY\_\* (DSN, etc.)                                  | Both use Sentry                 | **Live**       |
| VERBOSE                                                 | Logging                         | Dev/CI         |

---

## By Usage Context

### Dev/Debug only (local development)

- **DEV_TOOLS**, **DISABLE_DEV_TOOLS**, **BYPASS_CORS** – Desktop devtools, CORS bypass
- **ELECTRON_ARGS** – Electron CLI args for debugging
- **NO*DEBUG*\*** – Logger toggles (DB, Redux, network, etc.)
- **OVERRIDE_MODELID**, **OVERRIDE_MODEL_ID** – Device model override
- **USBTROUBLESHOOTING_PLATFORM** – USB troubleshooting
- **SHOW_ETHEREUM_BRIDGE** – Feature flag

### Test only (CI / Playwright / Detox)

- **DETOX** – Detox E2E (mobile)
- **PLAYWRIGHT_RUN**, **PWDEBUG** – Playwright E2E (desktop)
- **MOCK_REMOTE_LIVE_MANIFEST** – Injected in Playwright LiveAppWebview
- **DEBUG_POSTONBOARDINGHUB**, **DEBUG_UPDATE** – Used in Playwright test specs
- **TESTING**, **STAGING** – Select .env file (desktop: .env.testing vs .env.staging)

### Dev + Test (overlap)

- **MOCK**, **MOCK_COUNTERVALUES** – Mock mode in both dev and test
- **ENABLE_MSW** – MSW in dev server and tests
- **DEBUG\_\*** – Debug UI components (used in dev and Playwright specs)

### Live (runtime in production)

- **FIREBASE\_\*** – Desktop Remote Config, feature flags (mobile uses native config)
- **BRAZE\_\***, **DATADOG\_\***, **SENTRY\_\*** – Analytics, push, error reporting

### Release/Build (CI, signing, upload)

- **ANDROID\_\***, **APPLEID\_\***, **AZURE\_\*** – Signing, notarization
- **GENERATE_METAFILES**, **ENVFILE**

---

## Nx Named Inputs (current)

| Input          | Contents                           | Used by                                                |
| -------------- | ---------------------------------- | ------------------------------------------------------ |
| **desktopEnv** | Desktop-only vars                  | ledger-live-desktop build, nightly, pre-build, release |
| **mobileEnv**  | Mobile-only vars                   | live-mobile android:_, ios:_, e2e:ci                   |
| **sharedEnv**  | Shared vars (dev + test + release) | Both apps when needed                                  |

**releaseEnv** has been removed; targets use desktopEnv or mobileEnv as appropriate.

---

## Optional: Further split for cache optimization

To reduce cache invalidation for lib builds when only dev vars change:

- **sharedBuildEnv**: MOCK, DEBUG\_\*, ENABLE_MSW, etc. (affect build output via .env injection)
- **sharedDevEnv**: DEV*TOOLS, NO_DEBUG*\*, etc. (runtime only, not in lib builds)

Libs typically don't inject these; only app builds do. So this split would mainly help app build cache granularity.
