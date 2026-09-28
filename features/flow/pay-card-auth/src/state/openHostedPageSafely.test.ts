import { readCardUsEnv } from "@features/platform-card";
import { openHostedCardPathSafely, openHostedPageSafely } from "./openHostedPageSafely";

jest.mock("@features/platform-card", () => ({
  readCardUsEnv: jest.fn(),
}));

const mockedReadCardUsEnv = jest.mocked(readCardUsEnv);

describe("openHostedPageSafely", () => {
  it("opens the page and reports success", async () => {
    const openHostedPage = jest.fn(async () => undefined);

    await expect(openHostedPageSafely(openHostedPage, "/some/path")).resolves.toEqual({
      ok: true,
    });

    expect(openHostedPage).toHaveBeenCalledWith("/some/path");
  });

  it("returns the error instead of throwing when the page fails to open", async () => {
    const error = new Error("could not open browser");
    const openHostedPage = jest.fn(async () => Promise.reject(error));

    await expect(openHostedPageSafely(openHostedPage, "/some/path")).resolves.toEqual({
      ok: false,
      error,
    });
  });
});

describe("openHostedCardPathSafely", () => {
  const usAppId = "LEDGERUS";
  const buildPath = jest.fn(
    (appId?: string | null, currency?: string | null) =>
      [appId, currency].filter(Boolean).join("/") || "/",
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockedReadCardUsEnv.mockResolvedValue(false);
  });

  it("opens the path with no US app when the holder is not on that tenant", async () => {
    const openHostedPage = jest.fn(async () => undefined);

    await expect(
      openHostedCardPathSafely(openHostedPage, usAppId, buildPath, "btc"),
    ).resolves.toEqual({ ok: true });

    expect(mockedReadCardUsEnv).toHaveBeenCalledWith(usAppId);
    expect(buildPath).toHaveBeenCalledWith(null, "btc");
    expect(openHostedPage).toHaveBeenCalledWith("btc");
  });

  it("names the US app on the path when the holder belongs to it", async () => {
    mockedReadCardUsEnv.mockResolvedValue(true);
    const openHostedPage = jest.fn(async () => undefined);

    await openHostedCardPathSafely(openHostedPage, usAppId, buildPath);

    expect(buildPath).toHaveBeenCalledWith(usAppId, undefined);
    expect(openHostedPage).toHaveBeenCalledWith(usAppId);
  });

  it("returns the error instead of throwing when the page fails to open", async () => {
    const error = new Error("could not open browser");
    const openHostedPage = jest.fn(async () => Promise.reject(error));

    await expect(openHostedCardPathSafely(openHostedPage, usAppId, buildPath)).resolves.toEqual({
      ok: false,
      error,
    });
  });
});
