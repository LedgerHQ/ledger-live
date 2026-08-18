import { autoUpdater } from "electron-updater";
import { isStoreDistribution } from "~/helpers/distributionChannel";
import { init } from "./init";

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
});
