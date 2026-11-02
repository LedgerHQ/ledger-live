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

  it("falls back to home for an unresolvable path", () => {
    const context = createMockContext();

    assetHandler({ type: "asset", path: "unknown_coin" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/");
  });

  it("normalizes a coin path", () => {
    const context = createMockContext();

    assetHandler({ type: "asset", path: "BiTcOiN" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/bitcoin");
  });

  it("uses the canonical parsed coin id", () => {
    const context = createMockContext();

    assetHandler({ type: "asset", path: "bit%63oin" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/bitcoin");
  });

  it("navigates to asset page with the canonical coin path", () => {
    const context = createMockContext();

    assetHandler({ type: "asset", path: "ethereum" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/ethereum");
  });

  it("navigates to asset detail with market state for a Ledger token id", () => {
    const context = createMockContext();

    assetHandler({ type: "asset", path: "ethereum/erc20/usd_tether__erc20_" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/asset/ethereum%2Ferc20%2Fusd_tether__erc20_", {
      id: "ethereum/erc20/usd_tether__erc20_",
      ledgerIds: ["ethereum/erc20/usd_tether__erc20_"],
    });
  });
});
