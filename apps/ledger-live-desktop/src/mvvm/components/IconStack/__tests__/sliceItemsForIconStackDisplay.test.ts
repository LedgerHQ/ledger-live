import { bitcoinCurrency, ethereumCurrency } from "LLD/features/__mocks__/useSelectAssetFlow.mock";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { sliceItemsForIconStackDisplay } from "../utils/sliceItemsForIconStackDisplay";

describe("sliceItemsForIconStackDisplay", () => {
  const items = [ethereumCurrency, usdcToken, bitcoinCurrency, ethereumCurrency, usdcToken];

  it("returns all items when within the visible limit", () => {
    expect(sliceItemsForIconStackDisplay([ethereumCurrency, usdcToken])).toEqual({
      visibleItems: [ethereumCurrency, usdcToken],
      displayedOverflowCount: 0,
    });
  });

  it("reserves the last slot for the overflow badge when above the visible limit", () => {
    expect(sliceItemsForIconStackDisplay(items)).toEqual({
      visibleItems: [ethereumCurrency, usdcToken, bitcoinCurrency],
      displayedOverflowCount: 2,
    });
  });
});
