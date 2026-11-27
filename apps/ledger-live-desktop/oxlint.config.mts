import { defineConfig } from "oxlint";
import {
  ACCOUNT_DATA_SETUP_FILES,
  ACCOUNT_DATA_SOURCES,
  ACCOUNT_DESCRIPTOR,
  BIGNUMBER_NAMED_IMPORT,
  ELECTRON_CLIPBOARD,
  EXPO_CLIPBOARD,
  LIVE_COMMON_CURRENCY_ACCESSORS,
  LIVE_COMMON_FEATURE_FLAGS,
  LIVE_COMMON_LIB,
  LODASH,
  NAVIGATOR_CLIPBOARD,
  WALLET_FRAMEWORK_CURRENCY_TYPES,
} from "@support/lint/restricted-imports";
import { SUFFIX_IMPORTS_PLUGIN } from "@support/lint/plugins";
import { coinFamiliesLint } from "@support/lint/coin-families";

// Ledger Sync trust goes through the key ring packages: the v1 protocol stays behind them.
const KEY_RING_SECRET_PATHS = [
  {
    name: "@domain/entity-key-ring",
    importNames: ["selectKeyRingSecrets"],
    message:
      "The member key and the Ledger Sync key stay in @features/platform-key-ring. Read a meaning with selectIsLedgerSyncActive, selectIsKeyRingMember or selectKeyRingTreeId, or pass selectKeyRingSession to the key ring client.",
  },
  {
    name: "@domain/entity-key-ring",
    importNames: ["keyRingStateImported", "keyRingReset", "keyRingTreeSet", "keyRingMemberKeySet"],
    message:
      "Store key ring results through @features/platform-key-ring: importPersistedKeyRingState, resetKeyRingState, commitKeyRingTree, commitKeyRingMemberKey.",
  },
];
// The persisted value is opaque; only the persistence files write it.
const KEY_RING_PERSISTENCE_LENS_PATHS = [
  "@features/platform-key-ring",
  "@features/platform-key-ring/store",
  "@features/platform-key-ring/persistence",
].map(name => ({
  name,
  importNames: ["selectPersistedKeyRingState"],
  message: "Only the app persistence files write the key ring state to disk.",
}));
// @features/platform-ledger-sync owns these key ring operations: screens go through it.
const KEY_RING_FLOW_PATHS = [
  {
    name: "@features/platform-key-ring",
    importNames: [
      "acceptLedgerSyncResult",
      "isKeyRingError",
      "keyRingErrorForDisplay",
      "KeyRingPairingClosedError",
    ],
    message:
      "Use @features/platform-ledger-sync: useLedgerSyncResultAcceptance, useLedgerSyncServiceStatus, ledgerSyncErrorForDisplay and its pairing and recovery hooks.",
  },
];
const KEY_RING_PATHS = [
  ...KEY_RING_SECRET_PATHS,
  ...KEY_RING_PERSISTENCE_LENS_PATHS,
  ...KEY_RING_FLOW_PATHS,
];
const KEY_RING_PERSISTENCE_FILES = [
  "src/renderer/middlewares/db.ts",
  "src/renderer/storage.ts",
  "src/main/db/index.ts",
];
const KEY_RING_PATTERNS = [
  {
    group: ["@ledgerhq/ledger-key-ring-protocol", "@ledgerhq/ledger-key-ring-protocol/*"],
    message:
      "Use @features/platform-key-ring (KeyRingClient, session, state actions, intents, identity provider) and @domain/entity-key-ring (slice, selectors).",
  },
  {
    group: ["@ledgerhq/hw-ledger-key-ring-protocol", "@ledgerhq/hw-ledger-key-ring-protocol/*"],
    message: "Use getKeyRingDeviceRequirement from @features/platform-key-ring.",
  },
];

const APP_PATHS = [
  LODASH,
  BIGNUMBER_NAMED_IMPORT,
  EXPO_CLIPBOARD,
  ELECTRON_CLIPBOARD,
  {
    name: "react-redux",
    importNames: ["useSelector", "useDispatch", "useStore"],
    message:
      "Import typed hooks from 'LLD/hooks/redux' instead of 'react-redux' to ensure proper TypeScript typing.",
  },
  {
    name: "i18next",
    importNames: ["default", "t", "i18n"],
    message:
      "The app no longer initialises the i18next global singleton. Import the app instance (or its 't') from '~/renderer/i18n/init'.",
  },
  ...WALLET_FRAMEWORK_CURRENCY_TYPES,
  ...ACCOUNT_DESCRIPTOR,
];
const APP_PATTERNS = [
  LIVE_COMMON_LIB,
  {
    group: ["~/mvvm/**"],
    message: "Use 'LLD' alias instead of '~/mvvm'. Replace '~/mvvm' with 'LLD' in your imports.",
  },
  LIVE_COMMON_FEATURE_FLAGS,
  LIVE_COMMON_CURRENCY_ACCESSORS,
  ACCOUNT_DATA_SOURCES,
  ...KEY_RING_PATTERNS,
];

const coinFamilies = coinFamiliesLint({
  familiesDir: "src/renderer/families",
  barrel: "contract",
  allow: ["modals-loaders"],
});

export default defineConfig({
  env: { browser: true, es6: true, node: true },
  globals: {
    __DEV__: "readonly",
    INDEX_URL: "readonly",
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
    __APP_VERSION__: "readonly",
    __GIT_REVISION__: "readonly",
    __PRODUCTION__: "readonly",
    __PRERELEASE__: "readonly",
    __CHANNEL__: "readonly",
    __static: "readonly",
    $: "readonly",
  },
  categories: { correctness: "error", suspicious: "warn", pedantic: "off" },
  plugins: ["eslint", "import", "oxc", "unicorn", "typescript", "react", "jest"],
  jsPlugins: [SUFFIX_IMPORTS_PLUGIN, ...coinFamilies.jsPlugins],
  ignorePatterns: ["*.min.js", "src/mvvm/hooks/redux.ts", "tests/artifacts/**"],
  rules: {
    "eslint/no-unused-vars": "warn",
    "eslint/no-empty-pattern": "warn",
    "eslint/no-constant-binary-expression": "warn",
    "react/no-did-mount-set-state": "warn",
    "react/globals": "warn",
    "react/immutability": "warn",
    "react/incompatible-library": "warn",
    "react/no-did-update-set-state": "warn",
    "react/preserve-manual-memoization": "warn",
    "react/purity": "warn",
    "react/refs": "warn",
    "react/set-state-in-effect": "warn",
    "react/static-components": "warn",
    "react/use-memo": "warn",
    "react/void-use-memo": "warn",
    "import/namespace": "warn",
    "unicorn/no-useless-fallback-in-spread": "off",
    "unicorn/no-useless-spread": "off",
    "unicorn/no-new-array": "off",
    "unicorn/no-array-sort": "off",
    "unicorn/no-array-reverse": "off",
    "jest/no-conditional-expect": "warn",
    "jest/expect-expect": "warn",
    "jest/require-to-throw-message": "warn",
    "jest/valid-title": "warn",
    "jest/no-disabled-tests": "warn",
    "typescript/no-explicit-any": "error",
    "typescript/no-deprecated": "error",
    "eslint/no-restricted-properties": ["error", NAVIGATOR_CLIPBOARD],
    "import/no-duplicates": "error",
    "suffix-imports/no-platform-suffix": "error",
    ...coinFamilies.rules,
    "import/no-named-as-default": "off",
    "eslint/no-restricted-imports": [
      "error",
      { paths: [...APP_PATHS, ...KEY_RING_PATHS], patterns: APP_PATTERNS },
    ],
  },
  overrides: [
    {
      files: KEY_RING_PERSISTENCE_FILES,
      rules: {
        "eslint/no-restricted-imports": [
          "error",
          {
            paths: [...APP_PATHS, ...KEY_RING_SECRET_PATHS, ...KEY_RING_FLOW_PATHS],
            patterns: APP_PATTERNS,
          },
        ],
      },
    },
    {
      files: ["src/main/systemHandlers.ts", "src/main/systemHandlers.test.ts"],
      rules: {
        "eslint/no-restricted-imports": [
          "error",
          {
            paths: [BIGNUMBER_NAMED_IMPORT, ...ACCOUNT_DESCRIPTOR, ...KEY_RING_PATHS],
            patterns: KEY_RING_PATTERNS,
          },
        ],
      },
    },
    {
      files: ACCOUNT_DATA_SETUP_FILES,
      rules: {
        "eslint/no-restricted-imports": [
          "error",
          { paths: [BIGNUMBER_NAMED_IMPORT, ...KEY_RING_PATHS], patterns: KEY_RING_PATTERNS },
        ],
      },
    },
    {
      files: ["src/renderer/families/**"],
      rules: {
        "eslint/no-restricted-imports": [
          "error",
          {
            paths: [BIGNUMBER_NAMED_IMPORT, ...ACCOUNT_DESCRIPTOR, ...KEY_RING_PATHS],
            patterns: KEY_RING_PATTERNS,
          },
        ],
      },
    },
    {
      files: [
        "tests/**/*.ts",
        "tests/**/*.tsx",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.integration.ts",
        "**/*.integration.tsx",
      ],
      env: { jest: true },
      plugins: ["jest"],
      rules: { "typescript/no-explicit-any": "warn" },
    },
    {
      files: [
        "**/*.test.*",
        "**/__tests__/**",
        "**/__integrations__/**",
        "**/__mocks__/**",
        "tests/**",
      ],
      rules: {
        "coin-families/no-coin-specific-import": "off",
        "coin-families/no-family-branch": "off",
        "coin-families/no-currency-id-branch": "off",
      },
    },
  ],
});
