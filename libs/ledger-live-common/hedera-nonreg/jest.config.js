// Runs dump.nonreg.ts against develop's or this branch's Hedera code (VARIANT=develop|branch).
// run.sh puts develop's coin-hedera sources in coin-hedera/node_modules/.nonreg-develop, so they
// resolve the same dependencies, and develop's bridge api in out/develop-api.ts.
const path = require("path");

const common = path.resolve(__dirname, "..");
const hedera = path.resolve(common, "../coin-modules/coin-hedera");
const variant = process.env.VARIANT;
if (variant !== "develop" && variant !== "branch") throw new Error("VARIANT=develop|branch");

const hederaSrc =
  variant === "develop"
    ? path.join(hedera, "node_modules/.nonreg-develop/src")
    : path.join(hedera, "src");

const { constants, kStringMaxLength } = require("node:buffer");
process.env.__NODE_BUFFER_EXTRAS = JSON.stringify({ constants, kStringMaxLength });

const esmDeps = ["ky@", "@mysten\\+", "@scure\\+", "@noble\\+", "@babel\\+runtime"];
const swcOptions = { inputSourceMap: false, jsc: { target: "esnext" } };

module.exports = {
  rootDir: common,
  testMatch: [path.join(__dirname, process.env.TEST_FILE || "dump.nonreg.ts")],
  testEnvironment: "node",
  globals: { Buffer: Uint8Array },
  setupFiles: ["<rootDir>/jest.polyfills.js", path.join(__dirname, "proxy-setup.js")],
  setupFilesAfterEnv: [
    "@ledgerhq/wallet-framework-test-setup",
    "<rootDir>/src/__tests__/test-helpers/setup-registry.ts",
  ],
  modulePathIgnorePatterns: ["<rootDir>/lib-es", "<rootDir>/lib"],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", swcOptions],
    [`node_modules[\\\\|/].pnpm[\\\\|/](${esmDeps.join("|")}).+\\.(js|jsx|mjs)$`]: [
      "@swc/jest",
      swcOptions,
    ],
  },
  transformIgnorePatterns: [`node_modules[\\\\|/]\\.pnpm[\\\\|/](?!(${esmDeps.join("|")}))`],
  moduleDirectories: ["node_modules", "cli/node_modules"],
  moduleNameMapper: {
    "^@ledgerhq/coin-hedera/(.*)$": `${hederaSrc}/$1`,
    ...(variant === "develop" && {
      "^\\.\\./families/hedera/bridge/api$": path.join(__dirname, "out/develop-api.ts"),
    }),
    "^buffer$": "<rootDir>/jest.buffer-shim.js",
    "^(\\.{1,2}/.+)\\.js$": "$1",
    "^@tests/(.*)$": "<rootDir>/src/__tests__/$1",
  },
};
