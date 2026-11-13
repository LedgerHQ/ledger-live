import type * as UtilsModule from "./utils.mts";
import { buildRendererEnv } from "./utils.mts";

const originalEnv = process.env;

describe("buildRendererEnv", () => {
  it.each([
    ["development", "staging"],
    ["production", "prod"],
  ] as const)("defines the CONFIG_PROFILE of a %s build as %s", (mode, profile) => {
    expect(buildRendererEnv(mode)["process.env.CONFIG_PROFILE"]).toBe(JSON.stringify(profile));
  });
});

describe("__PRODUCTION__", () => {
  afterEach(() => {
    process.env = originalEnv;
  });

  it.each([
    { build: "a release bundled for production", version: "4.27.0", env: {}, production: true },
    {
      build: "a prerelease bundled for production",
      version: "4.27.0-next.1",
      env: {},
      production: false,
    },
    { build: "a staging release", version: "4.27.0", env: { STAGING: "1" }, production: false },
    { build: "a testing release", version: "4.27.0", env: { TESTING: "1" }, production: false },
    { build: "a nightly", version: "4.27.0", env: { NIGHTLY: "1" }, production: false },
    {
      build: "a development bundle",
      version: "4.27.0",
      env: { NODE_ENV: "development" },
      production: false,
    },
  ])("should be $production for $build", ({ version, env, production }) => {
    const utils = loadUtils(version, env);
    const define = { __PRODUCTION__: JSON.stringify(production) };

    expect(utils.buildMainEnv("production")).toMatchObject(define);
    expect(utils.buildRendererEnv("production")).toMatchObject(define);
  });
});

// utils.mts reads the version and the bundling env at import, so each case loads a fresh copy.
function loadUtils(version: string, env: NodeJS.ProcessEnv) {
  process.env = {
    ...originalEnv,
    GIT_REVISION: "test",
    NIGHTLY: undefined,
    TESTING: undefined,
    STAGING: undefined,
    NODE_ENV: "production",
    ...env,
  };
  jest.doMock("../../package.json", () => ({
    ...jest.requireActual("../../package.json"),
    version,
  }));
  let utils!: typeof UtilsModule;
  jest.isolateModules(() => {
    utils = require("./utils.mts");
  });
  return utils;
}
