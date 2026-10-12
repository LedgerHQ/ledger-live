import type { Bootstrap } from "~/bridge/contract";

type ProcessGlobals = {
  __BUILD_ENVS__: Record<string, string>;
  __LLD_PROCESS_ENV__?: Record<string, string | undefined>;
  __LLD_PROCESS_PLATFORM__?: string;
  __LLD_PROCESS_MAS__?: true;
  __LLD_PROCESS_WINDOWS_STORE__?: true;
  __LLD_PROCESS__?: {
    env: Record<string, string | undefined>;
    platform: string;
    cwd: () => string;
    nextTick: (callback: (...args: unknown[]) => void, ...args: unknown[]) => void;
    browser: true;
  };
};

const globals = globalThis as unknown as ProcessGlobals;
const buildEnvs = globals.__BUILD_ENVS__;

const loadProcess = (bootstrap: Partial<Bootstrap> = {}) => {
  jest.doMock("~/renderer/bridge", () => ({
    bootstrap: {
      env: Object.freeze({ SHARED: "bootstrap", RUNTIME: "runtime" }),
      os: { platform: "darwin" },
      distributionChannel: "direct",
      ...bootstrap,
    },
  }));
  jest.isolateModules(() => require("./process"));
};

describe("renderer process globals", () => {
  afterEach(() => {
    globals.__BUILD_ENVS__ = buildEnvs;
    delete globals.__LLD_PROCESS_ENV__;
    delete globals.__LLD_PROCESS_PLATFORM__;
    delete globals.__LLD_PROCESS_MAS__;
    delete globals.__LLD_PROCESS_WINDOWS_STORE__;
    delete globals.__LLD_PROCESS__;
  });

  it("should merge the build envs under the bootstrap env", () => {
    globals.__BUILD_ENVS__ = { SHARED: "build", BUILD_ONLY: "build" };

    loadProcess();

    expect(globals.__LLD_PROCESS_ENV__).toEqual({
      SHARED: "bootstrap",
      RUNTIME: "runtime",
      BUILD_ONLY: "build",
    });
  });

  it("should expose a mutable env although the bootstrap env is frozen", () => {
    loadProcess();
    const env = globals.__LLD_PROCESS_ENV__!;

    env.ASSIGNED = "value";

    expect(env.ASSIGNED).toBe("value");
  });

  it("should expose the bootstrap platform", () => {
    loadProcess({ os: { type: "Windows_NT", release: "10", platform: "win32", hostname: "h" } });

    expect(globals.__LLD_PROCESS_PLATFORM__).toBe("win32");
  });

  it.each([
    { distributionChannel: "mac-app-store", mas: true, windowsStore: undefined },
    { distributionChannel: "windows-store", mas: undefined, windowsStore: true },
    { distributionChannel: "direct", mas: undefined, windowsStore: undefined },
  ] as const)(
    "should flag the store build when distributed through $distributionChannel",
    ({ distributionChannel, mas, windowsStore }) => {
      loadProcess({ distributionChannel });

      expect(globals.__LLD_PROCESS_MAS__).toBe(mas);
      expect(globals.__LLD_PROCESS_WINDOWS_STORE__).toBe(windowsStore);
    },
  );

  it("should expose a process shim sharing the env and platform", () => {
    loadProcess();
    const shim = globals.__LLD_PROCESS__!;

    expect(shim.env).toBe(globals.__LLD_PROCESS_ENV__);
    expect(shim.platform).toBe("darwin");
    expect(shim.browser).toBe(true);
    expect(shim.cwd()).toBe("/");
  });

  it("should run nextTick callbacks with their arguments after a microtask", async () => {
    loadProcess();
    const callback = jest.fn();

    globals.__LLD_PROCESS__!.nextTick(callback, 1, 2);

    expect(callback).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(callback).toHaveBeenCalledWith(1, 2);
  });
});
