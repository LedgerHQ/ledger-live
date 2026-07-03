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

  it("uses the canonical parsed coin id when aggregated assets are off", () => {
    const context = createMockContext({ assetsPath: "/market" });

    assetHandler({ type: "asset", path: "bit%63oin" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/bitcoin");
  });

  it("falls back to home for unknown currency when aggregated assets are off", () => {
    const context = createMockContext({ assetsPath: "/market" });

    assetHandler({ type: "asset", path: "unknown_coin" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/");
  });

  it("normalizes a coin path when aggregated assets are on", () => {
    const context = createMockContext({ assetsPath: "/asset" });

    assetHandler({ type: "asset", path: "BiTcOiN" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/bitcoin");
  });

  it("navigates to asset page with the canonical coin path when aggregated assets are on", () => {
    const context = createMockContext({ assetsPath: "/asset" });

    assetHandler({ type: "asset", path: "ethereum" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/ethereum");
  });

  it("navigates to asset detail with market state for a Ledger token id when aggregated assets are on", () => {
    const context = createMockContext({ assetsPath: "/asset" });

    assetHandler({ type: "asset", path: "ethereum/erc20/usd_tether__erc20_" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/ethereum%2Ferc20%2Fusd_tether__erc20_", {
      id: "ethereum/erc20/usd_tether__erc20_",
      ledgerIds: ["ethereum/erc20/usd_tether__erc20_"],
    });
  });

  it("falls back to home for a token path when aggregated assets are off", () => {
    const context = createMockContext({ assetsPath: "/market" });

    assetHandler({ type: "asset", path: "ethereum/erc20/usd_tether__erc20_" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/");
  });
});
