import { openHostedPageSafely } from "./openHostedPageSafely";

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
