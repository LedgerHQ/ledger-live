import { resolveAmountScreenStack } from "../amountScreenLayout";

const compactSavings = { keyboard: 48, amount: 28 };

const regularHeights = {
  availableHeight: 500,
  amountHeight: 160,
  feesHeight: 52,
  quickActionsHeight: 48,
};

function resolve(
  heights: Partial<typeof regularHeights>,
  options: Partial<{ requestedQuickActions: boolean; compact: boolean }> = {},
) {
  return resolveAmountScreenStack({
    requestedQuickActions: options.requestedQuickActions ?? true,
    compact: options.compact ?? false,
    compactSavings,
    heights: { ...regularHeights, ...heights },
  });
}

describe("resolveAmountScreenStack", () => {
  it("should keep the regular layout when everything fits", () => {
    expect(resolve({})).toEqual({ compact: false, scrollEnabled: false, pinQuickActions: false });
  });

  it("should switch to compact when that is enough to fit everything", () => {
    expect(resolve({ availableHeight: 250 })).toEqual({
      compact: true,
      scrollEnabled: false,
      pinQuickActions: false,
    });
  });

  it("should compact and pin the quick actions when compact is not enough", () => {
    expect(resolve({ availableHeight: 180 })).toEqual({
      compact: true,
      scrollEnabled: true,
      pinQuickActions: true,
    });
  });

  it("should compact, pin and scroll on very small screens", () => {
    expect(resolve({ availableHeight: 100 })).toEqual({
      compact: true,
      scrollEnabled: true,
      pinQuickActions: true,
    });
  });

  it("should stay compact once the compact layout is measured", () => {
    expect(resolve({ availableHeight: 298, amountHeight: 132 }, { compact: true })).toEqual({
      compact: true,
      scrollEnabled: false,
      pinQuickActions: false,
    });
  });

  it("should leave compact when the regular layout fits again", () => {
    expect(resolve({ availableHeight: 548, amountHeight: 132 }, { compact: true })).toEqual({
      compact: false,
      scrollEnabled: false,
      pinQuickActions: false,
    });
  });

  it("should compact without pinning when the screen does not request quick actions", () => {
    expect(resolve({ availableHeight: 200 }, { requestedQuickActions: false })).toEqual({
      compact: true,
      scrollEnabled: false,
      pinQuickActions: false,
    });
  });

  it("should wait for a quick actions measurement before compacting or pinning", () => {
    expect(resolve({ availableHeight: 250, quickActionsHeight: 0 })).toEqual({
      compact: false,
      scrollEnabled: false,
      pinQuickActions: false,
    });
  });

  it("should keep the stack still until every block is measured", () => {
    expect(resolve({ availableHeight: 0 })).toEqual({
      compact: false,
      scrollEnabled: false,
      pinQuickActions: false,
    });
  });
});
