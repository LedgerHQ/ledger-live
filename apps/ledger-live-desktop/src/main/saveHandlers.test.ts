import { dialog, ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { CHANNELS, type SaveOutcome } from "~/bridge/contract";
import "./saveHandlers";

jest.mock("electron", () => ({
  dialog: { showSaveDialog: jest.fn() },
  ipcMain: { handle: jest.fn() },
}));
jest.mock("node:fs/promises", () => ({ __esModule: true, default: { writeFile: jest.fn() } }));
jest.mock("./logger", () => ({
  InMemoryLogger: { getLogger: () => ({ getLogs: () => [] }) },
}));

type Handler = (event: unknown, ...args: unknown[]) => Promise<SaveOutcome>;

// Captured before restoreMocks clears the registration calls.
const handlers = new Map(
  jest.mocked(ipcMain.handle).mock.calls.map(([channel, handler]) => [channel, handler as Handler]),
);
const invoke = (channel: string, ...args: unknown[]) => handlers.get(channel)!({}, ...args);

const options = { defaultPath: "export" };
const saves: Array<[string, unknown[]]> = [
  [CHANNELS.saveLogs, [{ options }, "[]"]],
  [CHANNELS.exportOperations, [{ options }, "a,b"]],
  [CHANNELS.savePng, [options, "aGVsbG8="]],
];

describe("save handlers", () => {
  const playwrightRun = process.env.PLAYWRIGHT_RUN;

  beforeEach(() => {
    jest.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (playwrightRun === undefined) delete process.env.PLAYWRIGHT_RUN;
    else process.env.PLAYWRIGHT_RUN = playwrightRun;
  });

  it.each(saves)("%s should write to the path the user picked", async (channel, args) => {
    jest.mocked(dialog.showSaveDialog).mockResolvedValue({ canceled: false, filePath: "/out" });

    await expect(invoke(channel, ...args)).resolves.toBe("saved");
    expect(fs.writeFile).toHaveBeenCalledWith("/out", expect.anything());
  });

  it.each(saves)("%s should report a dismissed dialog as canceled", async (channel, args) => {
    jest.mocked(dialog.showSaveDialog).mockResolvedValue({ canceled: true, filePath: "" });

    await expect(invoke(channel, ...args)).resolves.toBe("canceled");
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it.each(saves)(
    "%s should report a dialog that fails to open as failed",
    async (channel, args) => {
      jest.mocked(dialog.showSaveDialog).mockRejectedValue(new Error("no window"));

      await expect(invoke(channel, ...args)).resolves.toBe("failed");
    },
  );

  it.each(saves)("%s should report a write that fails as failed", async (channel, args) => {
    jest.mocked(dialog.showSaveDialog).mockResolvedValue({ canceled: false, filePath: "/out" });
    jest.mocked(fs.writeFile).mockRejectedValue(new Error("EACCES"));

    await expect(invoke(channel, ...args)).resolves.toBe("failed");
  });

  it("should report a dialog without a path as canceled", async () => {
    jest.mocked(dialog.showSaveDialog).mockResolvedValue({ canceled: false, filePath: "" });

    await expect(invoke(CHANNELS.exportOperations, { options }, "a,b")).resolves.toBe("canceled");
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it("should not write logs the renderer sent as invalid JSON", async () => {
    jest.mocked(dialog.showSaveDialog).mockResolvedValue({ canceled: false, filePath: "/out" });

    await expect(invoke(CHANNELS.saveLogs, { options }, "not json")).resolves.toBe("failed");
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it.each([
    [CHANNELS.exportOperations, [{ options }, ""]],
    [CHANNELS.savePng, [options, ""]],
  ])("%s should not open the dialog for an empty payload", async (channel, args) => {
    await expect(invoke(channel, ...args)).resolves.toBe("failed");
    expect(dialog.showSaveDialog).not.toHaveBeenCalled();
  });

  it("should use the E2E path only in a Playwright run", async () => {
    jest.mocked(dialog.showSaveDialog).mockResolvedValue({ canceled: false, filePath: "/picked" });
    const request = { options, e2ePath: "./e2e.csv" };

    process.env.PLAYWRIGHT_RUN = "1";
    await invoke(CHANNELS.exportOperations, request, "a,b");
    process.env.PLAYWRIGHT_RUN = "false";
    await invoke(CHANNELS.exportOperations, request, "a,b");

    expect(jest.mocked(fs.writeFile).mock.calls.map(([target]) => target)).toEqual([
      path.resolve(process.cwd(), "e2e.csv"),
      "/picked",
    ]);
  });

  it.each(["../escape.csv", "/tmp/escape.csv", "."])(
    "should refuse the E2E path %s outside the working directory",
    async e2ePath => {
      process.env.PLAYWRIGHT_RUN = "1";

      await expect(invoke(CHANNELS.saveLogs, { options, e2ePath }, "[]")).resolves.toBe("failed");
      await expect(invoke(CHANNELS.exportOperations, { options, e2ePath }, "a,b")).resolves.toBe(
        "failed",
      );
      expect(fs.writeFile).not.toHaveBeenCalled();
    },
  );
});
