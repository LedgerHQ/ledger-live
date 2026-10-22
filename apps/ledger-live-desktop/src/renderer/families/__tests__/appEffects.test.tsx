import React, { Suspense } from "react";
import { render, screen } from "tests/testSetup";
import { getFamilyAppEffect } from "../appEffects";

jest.mock("../bitcoin/zcashActivationTracking", () => ({
  ZcashFirstSyncTracking: () => <div data-testid="zcash-first-sync-tracking" />,
}));

describe("getFamilyAppEffect", () => {
  it("loads the bitcoin family effect on its own", async () => {
    const AppEffect = getFamilyAppEffect("bitcoin");
    expect(AppEffect).toBeDefined();
    if (!AppEffect) return;

    render(
      <Suspense fallback={null}>
        <AppEffect />
      </Suspense>,
    );

    expect(await screen.findByTestId("zcash-first-sync-tracking")).toBeInTheDocument();
  });

  it("returns the same component on every call, so React never remounts it", () => {
    expect(getFamilyAppEffect("bitcoin")).toBe(getFamilyAppEffect("bitcoin"));
  });

  it.each(["evm", "solana", "unknown"])("has no effect for %s", family => {
    expect(getFamilyAppEffect(family)).toBeUndefined();
  });
});
