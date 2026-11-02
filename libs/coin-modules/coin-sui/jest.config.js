const { createLibsCoinJestConfig } = require("@support/jest/libs-coin");

// Exception listed in support/jest/core/preset-overrides.js.
const esmPackages = ["@mysten", "@scure", "@noble"];

module.exports = createLibsCoinJestConfig(
  {
    rootDir: __dirname,
    coveragePathIgnorePatterns: [".*\\.integ\\.test\\.[tj]s"],
    transform: {
      "^.+\\.(ts|tsx)$": [
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
