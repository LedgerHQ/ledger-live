/**
 * Canonical scope definitions for the ledger-live monorepo.
 * Single source of truth for scope values used in commit messages, PR titles, branch names, and PR labels.
 */

export type ScopeDefinition = {
  readonly description: string;
  readonly paths: readonly string[];
};

export const scopes = {
  desktop: {
    description: "Ledger Wallet Desktop application",
    paths: ["apps/ledger-live-desktop/**/*"],
  },
  mobile: {
    description: "Ledger Wallet Mobile application",
    paths: ["apps/ledger-live-mobile/**/*"],
  },
  common: {
    description: "ledger-live-common shared library",
    paths: ["libs/ledger-live-common/**/*"],
  },
  ui: {
    description: "Lumen UI design system packages",
    paths: ["libs/ui/**/*"],
  },
  ledgerjs: {
    description: "ledgerjs transport and device libraries",
    paths: ["libs/ledgerjs/**/*"],
  },
  tools: {
    description: "Monorepo tooling packages",
    paths: ["tools/**/*"],
  },
  automation: {
    description: "GitHub workflows and repository automation",
    paths: [".github/**/*"],
  },
  cli: {
    description: "CLI application",
    paths: ["apps/cli/**/*"],
  },
  "wallet-cli": {
    description: "Wallet CLI application",
    paths: ["apps/wallet-cli/**/*"],
  },
  translations: {
    description: "Translation and locale files",
    paths: [
      "apps/ledger-live-desktop/static/i18n/**/*",
      "apps/ledger-live-mobile/src/locales/**/*",
    ],
  },
  screenshots: {
    description: "E2E test screenshots",
    paths: ["apps/ledger-live-desktop/tests/specs/**/*.png"],
  },
  "coin-modules-api": {
    description: "Coin module API layer changes",
    paths: ["libs/coin-framework/src/api/**", "libs/coin-modules/*/src/api/**"],
  },
  "coin-modules": {
    description: "Coin module packages and coin-framework",
    paths: ["libs/coin-framework/**/*", "libs/coin-modules/**/*"],
  },
  "shared-lib": {
    description: "Shared infrastructure libraries",
    paths: [
      "libs/asset-aggregation/**/*",
      "libs/client-ids/**/*",
      "libs/coin-modules-monitoring/**/*",
      "libs/coin-tester/**/*",
      "libs/coin-tester-modules/**/*",
      "libs/concordium-core/**/*",
      "libs/deeplink-module/**/*",
      "libs/device-core/**/*",
      "libs/device-react/**/*",
      "libs/disable-network-setup/**/*",
      "libs/domain-service/**/*",
      "libs/env/**/*",
      "libs/ethereum-provider/**/*",
      "libs/evm-tools/**/*",
      "libs/exchange-module/**/*",
      "libs/feature-flag-module/**/*",
      "libs/hw-ledger-key-ring-protocol/**/*",
      "libs/ledger-key-ring-protocol/**/*",
      "libs/ledger-services/**/*",
      "libs/live-config/**/*",
      "libs/live-countervalues/**/*",
      "libs/live-countervalues-react/**/*",
      "libs/live-currency-format/**/*",
      "libs/live-dmk-shared/**/*",
      "libs/live-dmk-speculos/**/*",
      "libs/live-hooks/**/*",
      "libs/live-network/**/*",
      "libs/live-signer-aleo/**/*",
      "libs/live-signer-canton/**/*",
      "libs/live-signer-evm/**/*",
      "libs/live-signer-solana/**/*",
      "libs/live-wallet/**/*",
      "libs/promise/**/*",
      "libs/psbtv2/**/*",
      "libs/speculos-transport/**/*",
      "libs/test-utils/**/*",
      "libs/wallet-api-acre-module/**/*",
    ],
  },
  "desktop-lib": {
    description: "Desktop-specific libraries",
    paths: ["libs/live-dmk-desktop/**/*"],
  },
  "mobile-lib": {
    description: "Mobile-specific libraries",
    paths: ["libs/live-dmk-mobile/**/*"],
  },
} as const satisfies Record<string, ScopeDefinition>;

export type ScopeName = keyof typeof scopes;

export const scopeNames = Object.keys(scopes) as ScopeName[];
