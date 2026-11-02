const { createLibsCoinIntegJestConfig } = require("@support/jest/libs-coin");

// The @mysten packages ship `.mjs` files, which the preset's ESM transform does not cover.
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
