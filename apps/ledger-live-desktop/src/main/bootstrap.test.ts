import { CHANNELS } from "~/bridge/contract";

// jest maps `electron-store` to this mock too, so its Store class is the default export.
jest.mock("electron", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ store: {}, set: jest.fn(), clear: jest.fn() })),
  app: {
    getPath: jest.fn((name: string) => `/tmp/${name}`),
    getLocale: jest.fn(() => "en-US"),
    getSystemLocale: jest.fn(() => "en-US"),
    dirname: "/tmp/app",
  },
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
  },
}));

const TOKEN = '{"accessToken":"secret"}';

function loadBootstrapWithToken() {
  process.env.CARD_SESSION_BOOTSTRAP = TOKEN;
  let bootstrap!: typeof import("./bootstrap");
  let electron!: typeof import("electron");
  let Store!: typeof import("electron-store");
  jest.isolateModules(() => {
    electron = require("electron");
    Store = require("electron-store").default;
    bootstrap = require("./bootstrap");
  });
  const handlers = new Map(
    jest.mocked(electron.ipcMain.handle).mock.calls.map(([channel, handler]) => [channel, handler]),
  );
  const invoke = (channel: string, ...args: unknown[]) =>
    handlers.get(channel)!({} as Electron.IpcMainInvokeEvent, ...args);
  const takeCardSession = () => invoke(CHANNELS.cardSessionBootstrap);
  const lldStore = () => jest.mocked(Store).mock.results[0].value;
  return { buildBootstrap: bootstrap.buildBootstrap, takeCardSession, invoke, lldStore };
}

describe("bootstrap", () => {
  const playwrightRun = process.env.PLAYWRIGHT_RUN;

  afterEach(() => {
    delete process.env.CARD_SESSION_BOOTSTRAP;
    delete process.env.Card_Session_Bootstrap;
    if (playwrightRun === undefined) delete process.env.PLAYWRIGHT_RUN;
    else process.env.PLAYWRIGHT_RUN = playwrightRun;
  });

  it("should take CARD_SESSION_BOOTSTRAP out of the main process env at startup", () => {
    loadBootstrapWithToken();

    expect(process.env).not.toHaveProperty("CARD_SESSION_BOOTSTRAP");
  });

  it("should keep CARD_SESSION_BOOTSTRAP out of the snapshot env", () => {
    const { env } = loadBootstrapWithToken().buildBootstrap();

    expect(env).not.toHaveProperty("CARD_SESSION_BOOTSTRAP");
    expect(env.NODE_ENV).toBe(process.env.NODE_ENV);
  });

  it("should keep CARD_SESSION_BOOTSTRAP out of the snapshot env whatever its case", () => {
    process.env.Card_Session_Bootstrap = TOKEN;
    const { buildBootstrap } = loadBootstrapWithToken();

    expect(process.env).not.toHaveProperty("Card_Session_Bootstrap");
    expect(buildBootstrap().env).not.toHaveProperty("Card_Session_Bootstrap");
  });

  it("should not hand the card session over when the dev/E2E gate is closed", async () => {
    delete process.env.PLAYWRIGHT_RUN;

    expect(await loadBootstrapWithToken().takeCardSession()).toBeNull();
  });

  it.each(["0", "false"])("should keep the gate closed when PLAYWRIGHT_RUN is %p", async value => {
    process.env.PLAYWRIGHT_RUN = value;

    expect(await loadBootstrapWithToken().takeCardSession()).toBeNull();
  });

  it("should hand the card session over on every renderer load in an E2E run", async () => {
    process.env.PLAYWRIGHT_RUN = "true";
    const { takeCardSession } = loadBootstrapWithToken();

    expect(await takeCardSession()).toBe(TOKEN);
    expect(await takeCardSession()).toBe(TOKEN);
  });

  it("should persist a renderer store write", () => {
    const { invoke, lldStore } = loadBootstrapWithToken();

    invoke(CHANNELS.storeSet, "a.b", 1);

    expect(lldStore().set).toHaveBeenCalledWith("a.b", 1);
  });

  it("should fail the renderer store write when main cannot persist it", () => {
    const { invoke, lldStore } = loadBootstrapWithToken();
    invoke(CHANNELS.storeSet, "a", 1);
    jest.mocked(lldStore().set).mockImplementationOnce(() => {
      throw new Error("EACCES");
    });

    expect(() => invoke(CHANNELS.storeSet, "a", 2)).toThrow("EACCES");
  });

  it("should clear the store on request", () => {
    const { invoke, lldStore } = loadBootstrapWithToken();

    invoke(CHANNELS.storeClear);

    expect(lldStore().clear).toHaveBeenCalledTimes(1);
  });
});
