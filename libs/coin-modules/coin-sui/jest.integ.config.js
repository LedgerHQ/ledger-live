const { createLibsCoinIntegJestConfig } = require("@support/jest/libs-coin");

// Exception listed in support/jest/core/preset-overrides.js.
const esmPackages = ["@mysten", "@scure", "@noble"];

module.exports = createLibsCoinIntegJestConfig(
  {
    rootDir: __dirname,
    testTimeout: 90_000,
    transform: {
      "^.+\\.(t|j)sx?$": [
        "@swc/jest",
        {
          jsc: {
            target: "esnext",
          },
        },
      ],
      [`node_modules/.pnpm/(${esmPackages.join("|")}).+\\.(js|mjs)?$`]: [
        "@swc/jest",
        {
          jsc: {
            target: "esnext",
          },
        },
      ],
    },
    transformIgnorePatterns: [`node_modules/.pnpm/(?!(${esmPackages.join("|")}))`],
  },
  { esm: false },
);
