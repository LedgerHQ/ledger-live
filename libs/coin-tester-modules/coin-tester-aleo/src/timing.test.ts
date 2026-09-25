import { timed } from "./timing";

describe("timed", () => {
  it("returns the wrapped function's resolved value", async () => {
    const result = await timed("noop", async () => 42);
    expect(result).toBe(42);
  });

  it("rethrows the wrapped function's rejection", async () => {
    await expect(
      timed("boom", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });

  it("logs the label and an elapsed-time line on both paths", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await timed("ok-path", async () => "value");
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("ok-path"));

    await timed("fail-path", async () => {
      throw new Error("x");
    }).catch(() => undefined);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("fail-path"));

    logSpy.mockRestore();
  });
});
