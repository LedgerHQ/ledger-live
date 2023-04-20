const testPathIgnorePatterns = [
  "benchmark/",
  "tools/",
  "mobile-test-app/",
  "lib/",
  "lib-es/",
  ".yalc",
  "cli/",
  "test-helpers/",
];

const defaultConfig = {
  globals: {
    __DEV__: false,
    __APP_VERSION__: "2.0.0",
    "ts-jest": {
      isolatedModules: true,
      diagnostics: "warnOnly",
    },
  },
  testEnvironment: "node",
  testPathIgnorePatterns,
  globalSetup: "<rootDir>/tests/setup.js",
  setupFiles: ["<rootDir>/tests/jestSetup.js"],
  moduleDirectories: ["node_modules"],
};

module.exports = {
  projects: [
    {
      ...defaultConfig,
      testPathIgnorePatterns: [
        ...testPathIgnorePatterns,
        "(/__tests__/.*|(\\.|/)react\\.test|spec)\\.tsx",
      ],
    },
    {
      ...defaultConfig,
      displayName: "dom",
      testEnvironment: "jsdom",
      transform: {
        "^.+\\.(ts|tsx)?$": "ts-jest",
        "^.+\\.(js|jsx)$": "babel-jest",
      },
      testRegex: "(/__tests__/.*|(\\.|/)react\\.test|spec)\\.tsx",
      testPathIgnorePatterns,
      moduleNameMapper: {
        // Force module uuid to resolve with the CJS entry point, because Jest does not support package.json.exports. See https://github.com/uuidjs/uuid/issues/451
        uuid: require.resolve("uuid"),
        "~/(.*)": "<rootDir>/src/$1",
        "\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
          "<rootDir>/fileMock.js",
        "@ledgerhq/domain-service(.*)": [
          "<rootDir>/../../libs/domain-service/src$1",
          "<rootDir>/../../libs/domain-service$1",
        ],
      },
    },
  ],
};
