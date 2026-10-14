import { ipcRenderer, webFrame } from "electron";
import { CHANNELS } from "~/bridge/contract";
import { shell as shellBridge, system } from "./system";

jest.mock("electron", () => ({
  ipcRenderer: { send: jest.fn(), invoke: jest.fn() },
  webFrame: { setVisualZoomLevelLimits: jest.fn(), getResourceUsage: jest.fn() },
}));

describe("preload system bridge", () => {
  it("should send external links on their channel", () => {
    shellBridge.openExternal("https://ledger.com");

    expect(ipcRenderer.send).toHaveBeenCalledWith(CHANNELS.openExternal, "https://ledger.com");
  });

  it("should ask main whether the clipboard matches", async () => {
    jest.mocked(ipcRenderer.invoke).mockResolvedValue(true);

    await expect(system.clipboardMatchesText("0xabc")).resolves.toBe(true);
    expect(ipcRenderer.invoke).toHaveBeenCalledWith(CHANNELS.clipboardMatchesText, "0xabc");
  });

  it("should set the zoom limits on the web frame", () => {
    system.setVisualZoomLevelLimits(1, 3);

    expect(webFrame.setVisualZoomLevelLimits).toHaveBeenCalledWith(1, 3);
  });

  it("should return the web frame resource usage", () => {
    const usage = { images: { count: 1 } } as unknown as Electron.ResourceUsage;
    jest.mocked(webFrame.getResourceUsage).mockReturnValue(usage);

    expect(system.getResourceUsage()).toBe(usage);
  });
});
