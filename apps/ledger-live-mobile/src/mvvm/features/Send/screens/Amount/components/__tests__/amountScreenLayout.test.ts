import { resolveAmountScreenStack } from "../amountScreenLayout";

const fittingHeights = {
  viewportHeight: 500,
  amountHeight: 160,
  feesHeight: 52,
  quickActionsHeight: 48,
};

describe("resolveAmountScreenStack", () => {
  it("should keep the stack still when the amount, fees, and quick actions fit", () => {
    expect(
      resolveAmountScreenStack({
        requestedQuickActions: true,
        heights: fittingHeights,
      }),
    ).toEqual({ scrollEnabled: false });
  });

  it("should scroll when quick actions no longer fit above the keyboard", () => {
    expect(
      resolveAmountScreenStack({
        requestedQuickActions: true,
        heights: { ...fittingHeights, viewportHeight: 220 },
      }),
    ).toEqual({ scrollEnabled: true });
  });

  it("should scroll when the amount and fees overflow on their own", () => {
    expect(
      resolveAmountScreenStack({
        requestedQuickActions: true,
        heights: { ...fittingHeights, viewportHeight: 180 },
      }),
    ).toEqual({ scrollEnabled: true });
  });

  it("should ignore quick actions height when the screen does not request them", () => {
    expect(
      resolveAmountScreenStack({
        requestedQuickActions: false,
        heights: { ...fittingHeights, viewportHeight: 220 },
      }),
    ).toEqual({ scrollEnabled: false });
  });

  it("should wait for a quick actions measurement before scrolling for them", () => {
    expect(
      resolveAmountScreenStack({
        requestedQuickActions: true,
        heights: { ...fittingHeights, viewportHeight: 220, quickActionsHeight: 0 },
      }),
    ).toEqual({ scrollEnabled: false });
  });
});
