import { marketHandler } from "../market.handler";
import { createMockContext } from "./test-utils";

describe("marketHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates to market list when no path", () => {
    const context = createMockContext();

    marketHandler({ type: "market", path: "" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/market");
  });

  it("navigates to market list when path is whitespace-only", () => {
    const context = createMockContext();

    marketHandler({ type: "market", path: "   " }, context);

    expect(context.navigate).toHaveBeenCalledWith("/market");
  });

  it("navigates to market detail when path is valid and aggregated assets are off", () => {
    const context = createMockContext({ assetsPath: "/market" });

    marketHandler({ type: "market", path: "ethereum" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/market/ethereum");
  });

  it("normalizes case when aggregated assets are off", () => {
    const context = createMockContext({ assetsPath: "/market" });

    marketHandler({ type: "market", path: "BiTcOiN" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/market/bitcoin");
  });

  it("falls back to market list for unknown currency when aggregated assets are off", () => {
    const context = createMockContext({ assetsPath: "/market" });

    marketHandler({ type: "market", path: "unknown_coin" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/market");
  });

  it("navigates to asset detail when path is provided and aggregated assets are on", () => {
    const context = createMockContext({ assetsPath: "/asset" });

    marketHandler({ type: "market", path: "ethereum" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/ethereum");
  });

  it("passes the path through without currency resolution when aggregated assets are on", () => {
    const context = createMockContext({ assetsPath: "/asset" });

    marketHandler({ type: "market", path: "BiTcOiN" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/BiTcOiN");
  });

  it("does not double-encode percent-encoded deeplink path segments when aggregated assets are on", () => {
    const context = createMockContext({ assetsPath: "/asset" });

    marketHandler({ type: "market", path: "a%2Fb" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/a%2Fb");
  });
});
