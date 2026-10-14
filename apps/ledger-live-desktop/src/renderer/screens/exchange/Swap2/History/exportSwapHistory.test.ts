import { files } from "~/renderer/bridge";
import { exportSwapHistory } from "./exportSwapHistory";

const request = { options: { defaultPath: "swap.csv" }, e2ePath: "./swap.csv" };

describe("exportSwapHistory", () => {
  it("should send the CSV to main and call back once saved", async () => {
    jest.mocked(files.exportOperations).mockResolvedValue("saved");
    const callback = jest.fn();

    await exportSwapHistory(request, "a,b", callback);

    expect(files.exportOperations).toHaveBeenCalledWith(request, "a,b");
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should stay silent when the user cancels", async () => {
    jest.mocked(files.exportOperations).mockResolvedValue("canceled");
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const callback = jest.fn();

    await exportSwapHistory(request, "a,b", callback);

    expect(callback).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("should warn when the write fails", async () => {
    jest.mocked(files.exportOperations).mockResolvedValue("failed");
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const callback = jest.fn();

    await exportSwapHistory(request, "a,b", callback);

    expect(callback).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith("Could not write the swap history CSV");
  });

  it("should swallow a bridge rejection", async () => {
    jest.mocked(files.exportOperations).mockRejectedValue(new Error("ipc closed"));

    await expect(exportSwapHistory(request, "a,b")).resolves.toBeUndefined();
  });
});
