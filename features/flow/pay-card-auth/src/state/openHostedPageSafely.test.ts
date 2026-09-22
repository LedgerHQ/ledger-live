import { readCardUsEnv } from "@features/platform-card";
import { openHostedCardPathSafely, openHostedPageSafely } from "./openHostedPageSafely";

jest.mock("@features/platform-card", () => ({
  readCardUsEnv: jest.fn(),
}));

const mockedReadCardUsEnv = jest.mocked(readCardUsEnv);

describe("openHostedPageSafely", () => {
  it("opens the page and never calls onError when it succeeds", async () => {
    const openHostedPage = jest.fn(async () => undefined);
    const onError = jest.fn();

    await openHostedPageSafely(openHostedPage, "/some/path", onError);

    expect(openHostedPage).toHaveBeenCalledWith("/some/path");
    expect(onError).not.toHaveBeenCalled();
  });

  it("reports the error instead of throwing when the page fails to open", async () => {
    const error = new Error("could not open browser");
    const openHostedPage = jest.fn(async () => Promise.reject(error));
    const onError = jest.fn();

    await expect(
      openHostedPageSafely(openHostedPage, "/some/path", onError),
    ).resolves.toBeUndefined();

    expect(onError).toHaveBeenCalledWith(error);
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
    const onError = jest.fn();

    await openHostedCardPathSafely(openHostedPage, usAppId, buildPath, onError, "btc");

    expect(mockedReadCardUsEnv).toHaveBeenCalledWith(usAppId);
    expect(buildPath).toHaveBeenCalledWith(null, "btc");
    expect(openHostedPage).toHaveBeenCalledWith("btc");
    expect(onError).not.toHaveBeenCalled();
  });

  it("names the US app on the path when the holder belongs to it", async () => {
    mockedReadCardUsEnv.mockResolvedValue(true);
    const openHostedPage = jest.fn(async () => undefined);

    await openHostedCardPathSafely(openHostedPage, usAppId, buildPath, jest.fn());

    expect(buildPath).toHaveBeenCalledWith(usAppId, undefined);
    expect(openHostedPage).toHaveBeenCalledWith(usAppId);
  });

  it("reports the error instead of throwing when the page fails to open", async () => {
    const error = new Error("could not open browser");
    const openHostedPage = jest.fn(async () => Promise.reject(error));
    const onError = jest.fn();

    await expect(
      openHostedCardPathSafely(openHostedPage, usAppId, buildPath, onError),
    ).resolves.toBeUndefined();

    expect(onError).toHaveBeenCalledWith(error);
  });
});
