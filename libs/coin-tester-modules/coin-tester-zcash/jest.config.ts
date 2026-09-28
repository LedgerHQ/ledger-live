import type { Config } from "jest";

// Resolve workspace @ledgerhq/* packages -- notably @ledgerhq/coin-zcash itself,
// whose network/ZCash test seam (see zcashClientTestSeam.ts) targets its
// TS source module id, not a built lib-es/lib artifact -- from source rather
// than from lib-es, mirroring coin-tester-cardano/coin-tester-vechain.
const sharedConfig = {
  testEnvironment: "node" as const,
  setupFilesAfterEnv: ["@ledgerhq/wallet-framework-test-setup"],
  testEnvironmentOptions: {
    customExportConditions: ["@ledgerhq/source", "node", "require", "default"],
  },
  transform: {
    "^.+\\.tsx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/.pnpm/(?!@ledgerhq\\+)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"] as string[],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

const config: Config = {
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : [])],
  projects: [
    {
      ...sharedConfig,
      displayName: "unit",
      testMatch: ["<rootDir>/src/signer.test.ts"],
    },
    {
      ...sharedConfig,
      displayName: "devnet",
      testMatch: ["<rootDir>/src/scenarii.test.ts"],
    },
  ],
};

export default config;
