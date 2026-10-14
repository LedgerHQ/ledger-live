import { app, clipboard, ipcMain, powerSaveBlocker, shell } from "electron";
import { CHANNELS } from "~/bridge/contract";
import { openURL } from "./openURL";
import updater from "./updater";
import "./systemHandlers";

jest.mock("electron", () => ({
  app: { getPath: jest.fn() },
  clipboard: { readText: jest.fn() },
  ipcMain: { on: jest.fn(), handle: jest.fn() },
  powerSaveBlocker: { start: jest.fn(), stop: jest.fn() },
  shell: { openPath: jest.fn() },
}));
jest.mock("./openURL", () => ({ openURL: jest.fn() }));
jest.mock("./updater", () => ({ __esModule: true, default: jest.fn() }));

type Listener = (event: unknown, ...args: unknown[]) => unknown;

// Captured before restoreMocks clears the registration calls.
const listeners = new Map(
  [...jest.mocked(ipcMain.on).mock.calls, ...jest.mocked(ipcMain.handle).mock.calls].map(
    ([channel, listener]) => [channel, listener as Listener],
  ),
);
const emit = (channel: string, ...args: unknown[]) => listeners.get(channel)!({}, ...args);

describe("system handlers", () => {
  it("should forward updater messages", () => {
    emit(CHANNELS.updater, "init");

    expect(updater).toHaveBeenCalledWith("init");
  });

  it("should open the user data directory", () => {
    jest.mocked(app.getPath).mockReturnValue("/user-data");

    emit(CHANNELS.openUserDataDirectory);

    expect(app.getPath).toHaveBeenCalledWith("userData");
    expect(shell.openPath).toHaveBeenCalledWith("/user-data");
  });

  it("should open external links through openURL", () => {
    emit(CHANNELS.openExternal, "https://ledger.com");

    expect(openURL).toHaveBeenCalledWith("https://ledger.com");
  });

  it.each([
    ["0xabc", true],
    ["0xdef", false],
  ])("should compare the clipboard with the expected text (%s)", (clipboardText, matches) => {
    jest.mocked(clipboard.readText).mockReturnValue(clipboardText);

    expect(emit(CHANNELS.clipboardMatchesText, "0xabc")).toBe(matches);
  });

  it("should return null when the clipboard cannot be read", () => {
    jest.mocked(clipboard.readText).mockImplementation(() => {
      throw new Error("unavailable");
    });

    expect(emit(CHANNELS.clipboardMatchesText, "0xabc")).toBeNull();
  });

  it("should keep the screen awake and return the blocker id", () => {
    jest.mocked(powerSaveBlocker.start).mockReturnValue(3);

    expect(emit(CHANNELS.keepScreenAwake)).toBe(3);
    expect(powerSaveBlocker.start).toHaveBeenCalledWith("prevent-display-sleep");
  });

  it("should release a screen awake blocker", () => {
    emit(CHANNELS.releaseScreenAwake, 3);

    expect(powerSaveBlocker.stop).toHaveBeenCalledWith(3);
  });

  it.each([undefined, Number.NaN])("should ignore a release without a valid id (%s)", id => {
    emit(CHANNELS.releaseScreenAwake, id);

    expect(powerSaveBlocker.stop).not.toHaveBeenCalled();
  });
});
