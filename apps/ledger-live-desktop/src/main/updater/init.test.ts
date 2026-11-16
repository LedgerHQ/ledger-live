import { autoUpdater } from "electron-updater";
import { CHANNELS } from "~/bridge/contract";
import { isStoreDistribution } from "~/helpers/distributionChannel";
import { getMainWindow } from "~/main/window-lifecycle";
import createElectronAppUpdater from "./createElectronAppUpdater";
import { init } from "./init";

type BuildGlobals = { __PRODUCTION__: boolean; __CHANNEL__: string | null };

const globals = globalThis as unknown as BuildGlobals;
const originalGlobals: BuildGlobals = {
  __PRODUCTION__: globals["__PRODUCTION__"],
  __CHANNEL__: globals["__CHANNEL__"],
};
const originalEnv = process.env;
const OVERRIDES = {
  UPDATE_FEED_URL: "http://127.0.0.1:8080",
  UPDATE_CHECK_FEED: "http://127.0.0.1:8080/signatures",
  UPDATE_CHECK_IGNORE: "1",
  UPDATE_CHECK_PUBKEY: "-----BEGIN PUBLIC KEY-----\nTEST\n-----END PUBLIC KEY-----\n",
};
const LEDGER_SIGNATURES_FEED = "https://resources.live.ledger.app/public_resources/signatures";
const PRERELEASE_SIGNATURES_FEED = "https://lw-prerelease-sigs.s3.eu-west-1.amazonaws.com";
const CHANNEL = "nightly";
const LEDGER_PUBKEY_LINE = "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEN7qcsG6bogi1nkD3jnMWS813wWguYEcI";

jest.mock("electron-updater", () => ({
  autoUpdater: {
    on: jest.fn(),
    checkForUpdates: jest.fn(),
    setFeedURL: jest.fn(),
    quitAndInstall: jest.fn(),
    autoInstallOnAppQuit: false,
    autoDownload: false,
    channel: "",
  },
}));

jest.mock("~/helpers/distributionChannel", () => ({
  isStoreDistribution: jest.fn(),
}));

jest.mock("~/main/window-lifecycle", () => ({
  getMainWindow: jest.fn(),
}));

jest.mock("./createElectronAppUpdater", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedAutoUpdater = jest.mocked(autoUpdater);
const mockedIsStoreDistribution = jest.mocked(isStoreDistribution);
const mockedCreateElectronAppUpdater = jest.mocked(createElectronAppUpdater);

// The module calls init() once at import time; clear those calls before each test.
beforeEach(() => {
  jest.clearAllMocks();
});

describe("updater init", () => {
  it("should not arm the auto-updater when installed from a store", () => {
    mockedIsStoreDistribution.mockReturnValue(true);

    init();

    expect(mockedIsStoreDistribution).toHaveBeenCalled();
    expect(mockedAutoUpdater.on).not.toHaveBeenCalled();
    expect(mockedAutoUpdater.checkForUpdates).not.toHaveBeenCalled();
  });

  it("should arm the auto-updater and check for updates for a direct (non-store) build", () => {
    mockedIsStoreDistribution.mockReturnValue(false);

    init();

    expect(mockedAutoUpdater.checkForUpdates).toHaveBeenCalledTimes(1);
    expect(mockedAutoUpdater.autoDownload).toBe(true);
    expect(mockedAutoUpdater.autoInstallOnAppQuit).toBe(true);
  });

  it("should register the updater lifecycle listeners for a direct build", () => {
    mockedIsStoreDistribution.mockReturnValue(false);

    init();

    const registeredEvents = mockedAutoUpdater.on.mock.calls.map(([event]) => event);
    expect(registeredEvents).toEqual(
      expect.arrayContaining([
        "checking-for-update",
        "update-available",
        "update-not-available",
        "download-progress",
        "update-downloaded",
        "error",
      ]),
    );
  });

  it("should send the updater status to the main window", () => {
    const send = jest.fn();
    jest.mocked(getMainWindow).mockReturnValue({ webContents: { send } } as never);
    mockedIsStoreDistribution.mockReturnValue(false);

    init();
    const [, listener] = mockedAutoUpdater.on.mock.calls.find(
      ([event]) => event === "update-available",
    )!;
    (listener as (info: unknown) => void)({ version: "9.9.9" });

    expect(send).toHaveBeenCalledWith(CHANNELS.updater, {
      status: "update-available",
      payload: { version: "9.9.9" },
    });
  });
});

describe.each([
  {
    build: "a non-production build",
    verb: "honor",
    production: false,
    setFeedURLCalls: [[{ provider: "generic", url: OVERRIDES.UPDATE_FEED_URL }]],
    signaturesFeed: OVERRIDES.UPDATE_CHECK_FEED,
    defaultSignaturesFeed: PRERELEASE_SIGNATURES_FEED,
    failedCheckStatus: "check-success",
    pubKey: OVERRIDES.UPDATE_CHECK_PUBKEY,
    channel: CHANNEL,
  },
  {
    build: "a production build",
    verb: "ignore",
    production: true,
    setFeedURLCalls: [],
    signaturesFeed: LEDGER_SIGNATURES_FEED,
    defaultSignaturesFeed: LEDGER_SIGNATURES_FEED,
    failedCheckStatus: "error",
    pubKey: expect.stringContaining(LEDGER_PUBKEY_LINE),
    channel: "",
  },
])(
  "updater overrides in $build",
  ({
    verb,
    production,
    setFeedURLCalls,
    signaturesFeed,
    defaultSignaturesFeed,
    failedCheckStatus,
    pubKey,
    channel,
  }) => {
    beforeEach(() => {
      process.env = { ...originalEnv, ...OVERRIDES };
      Object.assign(globals, { __PRODUCTION__: production, __CHANNEL__: CHANNEL });
      mockedIsStoreDistribution.mockReturnValue(false);
      mockedAutoUpdater.channel = "";
    });

    afterEach(() => {
      process.env = originalEnv;
      Object.assign(globals, originalGlobals);
    });

    it(`should ${verb} UPDATE_FEED_URL`, () => {
      loadInit();

      expect(mockedAutoUpdater.setFeedURL.mock.calls).toEqual(setFeedURLCalls);
    });

    it(`should ${verb} UPDATE_CHECK_FEED`, async () => {
      mockedCreateElectronAppUpdater.mockResolvedValue({ verify: jest.fn() } as never);

      loadInit();
      await downloadUpdate();

      expect(mockedCreateElectronAppUpdater).toHaveBeenCalledWith(
        expect.objectContaining({ feedURL: signaturesFeed }),
      );
    });

    it("should fall back to the default signatures feed without UPDATE_CHECK_FEED", async () => {
      delete process.env.UPDATE_CHECK_FEED;
      mockedCreateElectronAppUpdater.mockResolvedValue({ verify: jest.fn() } as never);

      loadInit();
      await downloadUpdate();

      expect(mockedCreateElectronAppUpdater).toHaveBeenCalledWith(
        expect.objectContaining({ feedURL: defaultSignaturesFeed }),
      );
    });

    it(`should ${verb} UPDATE_CHECK_IGNORE`, async () => {
      const send = jest.fn();
      jest.mocked(getMainWindow).mockReturnValue({ webContents: { send } } as never);
      mockedCreateElectronAppUpdater.mockResolvedValue({
        verify: jest.fn().mockRejectedValue(new Error("Invalid signature")),
      } as never);

      loadInit();
      await downloadUpdate();

      expect(send).toHaveBeenLastCalledWith(
        CHANNELS.updater,
        expect.objectContaining({ status: failedCheckStatus }),
      );
    });

    it(`should ${verb} UPDATE_CHECK_PUBKEY`, () => {
      let loadedPubKey = "";
      jest.isolateModules(() => {
        loadedPubKey = require("./ledger-pubkey").default;
      });

      expect(loadedPubKey).toEqual(pubKey);
    });

    it(`should ${verb} the __CHANNEL__ update channel`, () => {
      loadInit();

      expect(mockedAutoUpdater.channel).toBe(channel);
    });
  },
);

// The overrides are read when the module loads, which also calls init().
function loadInit() {
  jest.isolateModules(() => require("./init"));
}

async function downloadUpdate() {
  const [, listener] = mockedAutoUpdater.on.mock.calls.find(
    ([event]) => event === "update-downloaded",
  )!;
  await (listener as (info: unknown) => Promise<void>)({ version: "9.9.9" });
}
