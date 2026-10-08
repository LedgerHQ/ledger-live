// Env keys main copies into the renderer's bootstrap snapshot, on top of every @shared/env
// definition except WITHHELD. tools/rspack/rendererEnvGuard.cjs fails the renderer build on a
// read of a key that is in none of these lists, or on any mention of a WITHHELD key.

// Read through `@shared/env` with a build-time fallback (`__BUILD_ENVS__`); a runtime value wins.
const BUILD_ENV_NAMES = [
  "CARD_BAANX_API_URL",
  "CARD_BAANX_CLIENT_KEY",
  "CARD_BAANX_HOSTED_UI",
  "CARD_BAANX_US_APP_ID",
  "CARD_BAANX_LOGIN_MANIFEST_ID",
  "CARD_BAANX_HOSTED_MANIFEST_ID",
  "CARD_OAUTH_REDIRECT_URI",
];

const FORWARDED = [
  // @shared/env definitions that are also read as a literal `process.env.X`.
  "DEBUG_THEME",
  "DISABLE_TRANSACTION_BROADCAST",
  "LEDGER_CLIENT_VERSION",
  "MOCK",
  "MOCK_REMOTE_LIVE_MANIFEST",
  "PLAYWRIGHT_RUN",
  "SPECULOS_API_PORT",
  "SPECULOS_DEVICE",

  // E2E and test tooling.
  "PLAYWRIGHT_EXPORT_CSV_PATH",
  "SPECULOS_ADDRESS",
  "HIDE_DEBUG_MOCK",
  "DISABLE_MOCK_POINTER_EVENTS",
  "ENABLE_MSW",
  "SEGMENT_TEST",
  "OVERRIDE_MODEL_ID",
  "OVERRIDE_MODELID",
  "USBTROUBLESHOOTING_PLATFORM",
  // Read by key in src/config/windowConstants.ts.
  "LEDGER_MIN_WIDTH",
  "LEDGER_MIN_HEIGHT",

  // Developer and debug switches.
  "__DEV__",
  "DEBUG_FIRMWARE_UPDATE",
  "DEBUG_FW_VERSION",
  "DEBUG_LOTTIE",
  "DEBUG_POSTONBOARDINGHUB",
  "DEBUG_SKELETONS",
  "DEBUG_SUI_GRAPHQL",
  "DEBUG_UPDATE",
  "DISABLE_CONTEXT_MENU",
  "NO_DEBUG_ACTION",
  "NO_DEBUG_ANALYTICS",
  "NO_DEBUG_COUNTERVALUES",
  "NO_DEBUG_DB",
  "NO_DEBUG_DEVICE",
  "NO_DEBUG_NETWORK",
  "NO_DEBUG_TAB_KEY",
  "NO_DEBUG_WS",
  "SHOW_ETHEREUM_BRIDGE",
  "SNOW_EVENT",

  // Live-app overrides.
  "DEFAULT_BORROW_MANIFEST_ID",
  "DEFAULT_EARN_MANIFEST_ID",
  "DEFAULT_PERPS_MANIFEST_ID",
  "DEFAULT_SWAP_MANIFEST_ID",
  "LEDGER_LIVE_DEEPLINK",

  // Read off `bootstrap.env` directly by src/datadog/anonymizer.ts.
  "LEDGER_CONFIG_DIRECTORY",
  "HOME_DIRECTORY",
];

// Read by dependencies, but not settable from the user's environment.
const NOT_FORWARDED = [
  // styled-components
  "SC_ATTR",
  "SC_DISABLE_SPEEDY",
  "REACT_APP_SC_ATTR",
  "REACT_APP_SC_DISABLE_SPEEDY",
  // @walletconnect/core, @walletconnect/utils
  "DISABLE_GLOBAL_CORE",
  "IS_VITEST",
  // firebase
  "__FIREBASE_DEFAULTS__",
  // util (debuglog)
  "NODE_DEBUG",
  // Read by key: @open-draft/logger, @segment/analytics-next.
  "DEBUG",
  "LOG_LEVEL",
  "NODE_ENV",
];

// @shared/env definitions only main-side tooling reads; E2E runs put real secrets in them.
const WITHHELD = ["SEED"];

module.exports = { BUILD_ENV_NAMES, FORWARDED, NOT_FORWARDED, WITHHELD };
