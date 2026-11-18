import updater from "./index";

const mockQuitAndInstall = jest.fn<Promise<void>, []>();

jest.mock("./init", () => ({ __esModule: true, default: { quitAndInstall: mockQuitAndInstall } }));

describe("updater", () => {
  it("logs a quitAndInstall that fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    const error = new Error("installer missing");
    mockQuitAndInstall.mockRejectedValueOnce(error);

    updater("init");
    updater("quit-and-install");
    await new Promise(process.nextTick);

    expect(consoleError).toHaveBeenCalledWith("Auto-update error: quitAndInstall failed", error);
  });
});
