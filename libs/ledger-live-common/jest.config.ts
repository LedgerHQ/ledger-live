export default {
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
  testEnvironment: "node",
  coverageDirectory: "./coverage/",
  coverageReporters: ["json", "lcov", "clover"],
  collectCoverage: true,
  coveragePathIgnorePatterns: ["src/__tests__"],
  modulePathIgnorePatterns: [
    "<rootDir>/benchmark/.*",
    "<rootDir>/cli/.yalc/.*",
  ],
  testPathIgnorePatterns: [
    "benchmark/",
    "tools/",
    "mobile-test-app/",
    "lib/",
    "lib-es/",
    ".yalc",
    "cli/",
    "test-helpers/",
  ],
  moduleNameMapper: {
    "^@polkadot/wasm-crypto$": "@polkadot/wasm-crypto/index.cjs",
    "^@polkadot/wasm-crypto-asmjs$": "@polkadot/wasm-crypto-asmjs/empty.cjs",
    "^@polkadot/wasm-crypto-wasm$": "@polkadot/wasm-crypto-wasm/data.cjs",
    "^@polkadot/([^.]+)$": [
      "@polkadot/$1/index.cjs",
      "@polkadot/$1/node.cjs",
      "@polkadot/$1.cjs",
    ],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!@polkadot|@babel/runtime/helpers/esm/)",
  ],
  moduleDirectories: ["node_modules", "cli/node_modules"],
};
