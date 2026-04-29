import { openProductTour } from "LLD/features/ProductTour/Drawer/productTourDialog";
import { productTourHandler } from "../productTour.handler";
import { createMockContext } from "./test-utils";

describe("productTourHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates to portfolio and opens Product Tour when onboarding is complete", () => {
    const context = createMockContext({ hasCompletedOnboarding: true });

    productTourHandler({ type: "product-tour" }, context);

    expect(context.navigate).toHaveBeenCalledWith("/");
    expect(context.dispatch).toHaveBeenCalledWith(openProductTour());
  });

  it("does not open Product Tour when onboarding is incomplete", () => {
    const context = createMockContext({ hasCompletedOnboarding: false });

    productTourHandler({ type: "product-tour" }, context);

    expect(context.navigate).not.toHaveBeenCalled();
    expect(context.dispatch).not.toHaveBeenCalled();
  });

  it("does not open Product Tour when lwdProductTour feature flag is disabled", () => {
    const context = createMockContext({ isProductTourEnabled: false });

    productTourHandler({ type: "product-tour" }, context);

    expect(context.navigate).not.toHaveBeenCalled();
    expect(context.dispatch).not.toHaveBeenCalled();
  });
});
