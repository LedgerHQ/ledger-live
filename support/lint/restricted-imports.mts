// The `eslint/no-restricted-imports` entries that several oxlint configs share. A config that sets
// the rule replaces any extended one as a whole, so each config spreads the entries it needs into
// its own list. A JSON config cannot import this module: it extends one of the fragments in
// `restricted-imports/`, which `node src/restricted-imports-fragments.js` writes from
// `JSON_FRAGMENTS` and the package tests keep in sync.

export const CLIPBOARD_MESSAGE =
  "Use copyToClipboard / readClipboard from @shared/clipboard instead of";

export const LODASH = "lodash";

export const EXPO_CLIPBOARD = {
  name: "expo-clipboard",
  message: `${CLIPBOARD_MESSAGE} expo-clipboard.`,
};

const WALLET_FRAMEWORK_CURRENCY_TYPES_RESTRICTION = {
  importNames: [
    "CryptoCurrency",
    "TokenCurrency",
    "Currency",
    "Unit",
    "FiatCurrency",
    "ExplorerView",
    "CryptoCurrencyId",
    "TokenCurrencyId",
    "CryptoCurrencyIdSchema",
    "TokenCurrencyIdSchema",
  ],
  message:
    "Wallet-framework currency types are for coin-modules. Import from @domain/entity-currency-* " +
    "(unions from @domain/entity-currency).",
};

export const WALLET_FRAMEWORK_CURRENCY_TYPES = [
  {
    name: "@ledgerhq/ledger-wallet-framework/types",
    ...WALLET_FRAMEWORK_CURRENCY_TYPES_RESTRICTION,
  },
  { name: "@ledgerhq/ledger-wallet-framework/api", ...WALLET_FRAMEWORK_CURRENCY_TYPES_RESTRICTION },
];

export const LIVE_COMMON_LIB = {
  group: ["@ledgerhq/live-common/lib/**", "@ledgerhq/live-common/lib-es/**"],
  message: "Please remove the /lib import from live-common import.",
};

export const LIVE_COMMON_FEATURE_FLAGS = {
  group: [
    "@ledgerhq/live-common/featureFlags",
    "@ledgerhq/live-common/featureFlags/index",
    "@ledgerhq/live-common/featureFlags/FeatureFlagsContext",
    "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/*",
    "@ledgerhq/live-common/featureFlags/defaultFeatures",
    "@ledgerhq/live-common/featureFlags/groupedFeatures",
  ],
  importNamePattern:
    "^(useFeature|useFeatureFlags|useHasLocallyOverriddenFeatureFlags|useWalletFeaturesConfig|" +
    "FeatureToggle|DEFAULT_FEATURES|groupedFeatures|GroupedFeature)$",
  message:
    "Use @features/platform-feature-flags for hooks/FeatureToggle, @shared/feature-flags for " +
    "actions/selectors/types/constants (e.g. FEATURE_FLAGS_DEFAULTS, groupedFeatures, " +
    "GroupedFeature).",
};

export const LIVE_COMMON_CURRENCY_ACCESSORS = {
  group: [
    "@ledgerhq/live-common/currencies",
    "@ledgerhq/live-common/currencies/index",
    "@ledgerhq/live-common/currencies/helpers",
  ],
  importNamePattern:
    "^(listCryptoCurrencies|getCryptoCurrencyById|hasCryptoCurrencyId|findCryptoCurrency|" +
    "findCryptoCurrencyById|findCryptoCurrencyByScheme|findCryptoCurrencyByKeyword|" +
    "findCryptoCurrencyByTicker|listFiatCurrencies|findFiatCurrencyByTicker|" +
    "getFiatCurrencyByTicker|hasFiatCurrencyTicker)$",
  message:
    "Currency accessors are owned by the domain layer. Import crypto accessors from " +
    "@domain/entity-currency-crypto and fiat accessors from @domain/entity-currency-fiat.",
};

export const COIN_MODULE_CREATE_API = {
  group: ["@ledgerhq/coin-*/api", "@ledgerhq/coin-*/api/*"],
  importNamePattern: "^createApi$",
  message:
    "Reach a coin module through getCoinModuleApi (bridge/generic-coin-framework/api), which " +
    "applies the framework's withDefaults. Since a module may omit the capabilities its chain " +
    "lacks, calling createApi directly yields an object with those methods missing, and the call " +
    "fails at runtime with nothing failing at compile time. If a direct call is genuinely " +
    "needed, add the file to the exemptions in this config and record in the PR why it cannot " +
    "break.",
};

export const RELATIVE_IMPORTS = {
  group: ["**/../**"],
  message: "Relative imports are restricted. Please use bare imports or path aliases instead.",
};

// The options of each JSON fragment, keyed by its file name. Fragments do not combine: extending
// two that set the rule keeps the last one only, so a JSON config extends the one that holds its
// whole list.
export const JSON_FRAGMENTS = {
  "lodash.json": { paths: [LODASH] },
  "relative-imports.json": { patterns: [RELATIVE_IMPORTS] },
  "wallet-cli.json": {
    paths: [LODASH],
    patterns: [LIVE_COMMON_LIB, LIVE_COMMON_CURRENCY_ACCESSORS],
  },
};
