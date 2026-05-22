import { assetHandler } from "../asset.handler";
import { createMockContext } from "./test-utils";

describe("assetHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates to home when no path is provided", () => {
    const context = createMockContext();

    assetHandler({ type: "asset", path: "" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/");
  });

  it("navigates to home when path is whitespace-only", () => {
    const context = createMockContext();

    assetHandler({ type: "asset", path: "   " }, context);

    expect(context.navigate).toHaveBeenCalledWith("/");
  });

  it("navigates to asset page when path is valid and aggregated assets are off", () => {
    const context = createMockContext({ assetsPath: "/market" });

    assetHandler({ type: "asset", path: "ethereum" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/ethereum");
  });

  it("normalizes case when aggregated assets are off", () => {
    const context = createMockContext({ assetsPath: "/market" });

    assetHandler({ type: "asset", path: "BiTcOiN" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/bitcoin");
  });

  it("falls back to home for unknown currency when aggregated assets are off", () => {
    const context = createMockContext({ assetsPath: "/market" });

    assetHandler({ type: "asset", path: "unknown_coin" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/");
  });

  it("passes the path through when aggregated assets are on", () => {
    const context = createMockContext({ assetsPath: "/asset" });

    assetHandler({ type: "asset", path: "BiTcOiN" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/BiTcOiN");
  });

  it("navigates to asset page with raw path when aggregated assets are on", () => {
    const context = createMockContext({ assetsPath: "/asset" });

    assetHandler({ type: "asset", path: "ethereum" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/ethereum");
  });

  it("does not double-encode percent-encoded deeplink path segments when aggregated assets are on", () => {
    const context = createMockContext({ assetsPath: "/asset" });

    assetHandler({ type: "asset", path: "a%2Fb" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/a%2Fb");
  });
});
