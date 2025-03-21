const transformIncludePatterns = ["ky"];

/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "coverage",
  preset: "ts-jest",
  testEnvironment: "node",
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
  modulePathIgnorePatterns: ["__tests__/fixtures"],
};
