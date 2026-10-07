import { ipcRenderer } from "electron";
import { CHANNELS } from "~/bridge/contract";

jest.mock("electron", () => ({
  ipcRenderer: { send: jest.fn(), invoke: jest.fn() },
  contextBridge: {
    exposeInMainWorld: jest.fn((key: string, api: object) => Object.assign(window, { [key]: api })),
  },
}));
jest.mock("./bridge", () => ({ installBridge: jest.fn() }));
jest.mock("@ledgerhq/react-ui/styles/index", () => ({
  palettes: {
    dark: { background: { default: "#000" } },
    light: { background: { default: "#fff" } },
  },
}));

const loadPreload = () => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
  jest.isolateModules(() => {
    require("./index");
  });
};

describe("preload", () => {
  it("should set the window background from the OS theme", () => {
    loadPreload();

    expect(ipcRenderer.send).toHaveBeenCalledWith(CHANNELS.setBackgroundColor, "#fff");
  });

  it("should tell main the page is ready to show once the DOM is loaded", () => {
    jest.useFakeTimers();
    loadPreload();

    window.dispatchEvent(new Event("DOMContentLoaded"));
    jest.advanceTimersByTime(200);

    expect(ipcRenderer.send).toHaveBeenCalledWith(CHANNELS.readyToShow, {});
    jest.useRealTimers();
  });

  it("should expose the renderer reload and webview hooks on window.api", async () => {
    jest.mocked(ipcRenderer.invoke).mockResolvedValue(undefined);
    loadPreload();

    await window.api.reloadRenderer();
    window.api.openWindow(4, ["ledger.com"]);

    expect(ipcRenderer.invoke).toHaveBeenCalledWith(CHANNELS.reloadRenderer);
    expect(ipcRenderer.send).toHaveBeenCalledWith(CHANNELS.webviewDomReady, 4, ["ledger.com"]);
  });
});
