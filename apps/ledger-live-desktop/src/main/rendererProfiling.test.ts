import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { net, protocol } from "electron";
import {
  allowRendererProfiling,
  createRendererFileHandler,
  isDefaultInstallLocation,
  type InstallLocation,
} from "./rendererProfiling";

jest.mock("electron", () => ({
  app: { getName: jest.fn(() => "Ledger Wallet") },
  net: { fetch: jest.fn() },
  protocol: { handle: jest.fn() },
}));

const fetchFile = jest.mocked(net.fetch);
const root = path.join(os.tmpdir(), "renderer-profiling");
const buildDirectory = path.join(root, "Applications", "app.asar", ".webpack");
const indexPath = path.join(buildDirectory, "index.html");
const fileRequest = (file: string, query = "") =>
  new Request(`${pathToFileURL(file).href}${query}`, { headers: { range: "bytes=0-" } });

const mac: InstallLocation = { platform: "darwin", appName: "Ledger Wallet", env: {} };
const windows: InstallLocation = {
  platform: "win32",
  appName: "Ledger Wallet",
  env: { ProgramFiles: "C:\\Program Files", "ProgramFiles(x86)": "C:\\Program Files (x86)" },
};
const linux: InstallLocation = { platform: "linux", appName: "Ledger Wallet", env: {} };
const macBuild = "/Applications/Ledger Wallet.app/Contents/Resources/app.asar/.webpack";

describe("renderer profiling", () => {
  beforeEach(() => {
    fetchFile.mockImplementation(
      async () => new Response("body", { status: 200, headers: { "content-type": "text/html" } }),
    );
  });

  describe("isDefaultInstallLocation", () => {
    it.each<[string, string, InstallLocation]>([
      ["the macOS Applications folder", macBuild, mac],
      [
        "a renamed channel build in the macOS Applications folder",
        "/Applications/Ledger Wallet Beta.app/Contents/Resources/app.asar/.webpack",
        { ...mac, appName: "Ledger Wallet Beta" },
      ],
      [
        "Program Files on Windows",
        "C:\\Program Files\\Ledger Wallet\\resources\\app.asar\\.webpack",
        windows,
      ],
      [
        "Program Files on Windows, whatever the case",
        "c:\\program files\\ledger wallet\\resources\\app.asar\\.webpack",
        windows,
      ],
      [
        "Program Files (x86) on Windows",
        "C:\\Program Files (x86)\\Ledger Wallet\\resources\\app.asar\\.webpack",
        windows,
      ],
      [
        "the default AppImage mount on Linux",
        "/tmp/.mount_ledgerAb12Cd/resources/app.asar/.webpack",
        linux,
      ],
    ])("accepts %s", (_, build, location) => {
      expect(isDefaultInstallLocation(build, location)).toBe(true);
    });

    it.each<[string, string, InstallLocation]>([
      [
        "a renamed app bundle",
        "/Applications/Someone's Wallet.app/Contents/Resources/app.asar/.webpack",
        mac,
      ],
      [
        "a subfolder of Applications",
        "/Applications/Someone/Ledger Wallet.app/Contents/Resources/app.asar/.webpack",
        mac,
      ],
      [
        "the Applications folder of a home folder",
        "/Users/someone/Applications/Ledger Wallet.app/Contents/Resources/app.asar/.webpack",
        mac,
      ],
      [
        "a translocated or mounted copy",
        "/Volumes/Ledger Wallet/Ledger Wallet.app/Contents/Resources/app.asar/.webpack",
        mac,
      ],
      ["an unpacked build", "/Applications/Ledger Wallet.app/Contents/Resources/app/.webpack", mac],
      [
        "a custom folder on another drive",
        "D:\\Someone\\Ledger Wallet\\resources\\app.asar\\.webpack",
        windows,
      ],
      [
        "a per-user install",
        "C:\\Users\\someone\\AppData\\Local\\Programs\\Ledger Wallet\\resources\\app.asar\\.webpack",
        windows,
      ],
      [
        "a subfolder of Program Files",
        "C:\\Program Files\\Someone\\Ledger Wallet\\resources\\app.asar\\.webpack",
        windows,
      ],
      [
        "Program Files when Windows does not report it",
        "C:\\Program Files\\Ledger Wallet\\resources\\app.asar\\.webpack",
        { ...windows, env: {} },
      ],
      ["a renamed AppImage", "/tmp/.mount_someonAb12Cd/resources/app.asar/.webpack", linux],
      ["an extracted AppImage", "/home/someone/squashfs-root/resources/app.asar/.webpack", linux],
      ["another platform", macBuild, { ...mac, platform: "freebsd" }],
    ])("refuses %s", (_, build, location) => {
      expect(isDefaultInstallLocation(build, location)).toBe(false);
    });
  });

  it("adds the js-profiling Document-Policy to the renderer page, query string included", async () => {
    const response = await createRendererFileHandler(buildDirectory)(
      fileRequest(indexPath, "?theme=dark"),
    );

    expect(fetchFile).toHaveBeenCalledWith(
      pathToFileURL(indexPath).href,
      expect.objectContaining({ bypassCustomProtocolHandlers: true }),
    );
    expect(response.headers.get("Document-Policy")).toBe("js-profiling");
    expect(response.headers.get("content-type")).toBe("text/html");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("body");
  });

  it("returns other build files as read, with the request headers forwarded for range reads", async () => {
    const fileResponse = new Response("video", { status: 206 });
    fetchFile.mockResolvedValueOnce(fileResponse);

    const response = await createRendererFileHandler(buildDirectory)(
      fileRequest(path.join(buildDirectory, "assets", "intro.mp4")),
    );

    expect(response).toBe(fileResponse);
    const [, init] = fetchFile.mock.calls[0];
    expect(new Headers(init?.headers).get("range")).toBe("bytes=0-");
  });

  it.each([
    ["a file outside the build folder", pathToFileURL(path.join(root, "secrets.txt")).href],
    [
      "a sibling folder sharing the build folder prefix",
      pathToFileURL(`${buildDirectory}-evil/x.js`).href,
    ],
    ["an undecodable file URL", "file:///a%2Fb"],
  ])("refuses %s without reading it", async (_, url) => {
    const response = await createRendererFileHandler(buildDirectory)(new Request(url));

    expect(response.status).toBe(403);
    expect(fetchFile).not.toHaveBeenCalled();
  });

  it("serves the renderer page through a file: handler for a build in its default folder", async () => {
    expect(allowRendererProfiling(macBuild, mac)).toBe(true);

    expect(protocol.handle).toHaveBeenCalledWith("file", expect.any(Function));
    const [[, handler]] = jest.mocked(protocol.handle).mock.calls;
    const response = await handler(
      fileRequest(path.join(macBuild, "index.html").replaceAll(path.posix.sep, path.sep)),
    );
    expect(response.headers.get("Document-Policy")).toBe("js-profiling");
  });

  it("leaves file: untouched for a build outside its default folder", () => {
    expect(allowRendererProfiling(buildDirectory, mac)).toBe(false);
    expect(protocol.handle).not.toHaveBeenCalled();
  });

  it("reads the install location of the running app by default", () => {
    expect(allowRendererProfiling(buildDirectory)).toBe(false);
    expect(protocol.handle).not.toHaveBeenCalled();
  });
});
