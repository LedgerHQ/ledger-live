import { ipcMain } from "electron";
import { CHANNELS } from "~/bridge/contract";
import { buildBootstrap } from "./bootstrap";

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

// Captured before restoreMocks clears the registration calls.
const handlers = new Map(
  jest.mocked(ipcMain.handle).mock.calls.map(([channel, handler]) => [channel, handler]),
);
const takeCardSession = () =>
  handlers.get(CHANNELS.cardSessionBootstrap)!({} as Electron.IpcMainInvokeEvent);

describe("bootstrap", () => {
  beforeEach(() => {
    process.env.CARD_SESSION_BOOTSTRAP = '{"accessToken":"secret"}';
  });

  const playwrightRun = process.env.PLAYWRIGHT_RUN;

  afterEach(() => {
    delete process.env.CARD_SESSION_BOOTSTRAP;
    if (playwrightRun === undefined) delete process.env.PLAYWRIGHT_RUN;
    else process.env.PLAYWRIGHT_RUN = playwrightRun;
  });

  it("should keep CARD_SESSION_BOOTSTRAP out of the snapshot env", () => {
    const { env } = buildBootstrap();

    expect(env).not.toHaveProperty("CARD_SESSION_BOOTSTRAP");
    expect(env.NODE_ENV).toBe(process.env.NODE_ENV);
  });

  it("should keep CARD_SESSION_BOOTSTRAP out of the snapshot env whatever its case", () => {
    process.env.Card_Session_Bootstrap = '{"accessToken":"secret"}';

    expect(buildBootstrap().env).not.toHaveProperty("Card_Session_Bootstrap");

    delete process.env.Card_Session_Bootstrap;
  });

  it("should not hand the card session over when the dev/E2E gate is closed", async () => {
    delete process.env.PLAYWRIGHT_RUN;

    expect(await takeCardSession()).toBeNull();
  });

  it.each(["0", "false"])("should keep the gate closed when PLAYWRIGHT_RUN is %p", async value => {
    process.env.PLAYWRIGHT_RUN = value;

    expect(await takeCardSession()).toBeNull();
  });

  it("should hand the card session over in an E2E run", async () => {
    process.env.PLAYWRIGHT_RUN = "true";

    expect(await takeCardSession()).toBe('{"accessToken":"secret"}');
  });
});
