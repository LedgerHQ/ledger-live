const transformIncludePatterns = ["ky", "@mysten", "@scure", "@noble"];

module.exports = {
  testEnvironment: "node",
  testPathIgnorePatterns: ["lib/", "lib-es/", ".*\\.integ\\.test\\.ts"],
  setupFilesAfterEnv: ["@ledgerhq/disable-network-setup"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
    [`node_modules/.pnpm/(${transformIncludePatterns.join("|")}).+\\.(js|mjs)?$`]: [
      "@swc/jest",
      {
        jsc: {
          target: "esnext",
        },
      },
    ],
  },
  transformIgnorePatterns: [`node_modules/.pnpm/(?!(${transformIncludePatterns.join("|")}))`],
};
