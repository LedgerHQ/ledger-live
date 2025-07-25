const transformIncludePatterns = ["ky"];

/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testTimeout: 180000,
  testEnvironment: "node",
  testRegex: "\\.monitor\\.test\\.ts$",
  testPathIgnorePatterns: ["lib/", "lib-es/"],
  transform: {
    [`node_modules/.pnpm/(${transformIncludePatterns.join("|")}).+\\.(js|jsx)?$`]: [
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
