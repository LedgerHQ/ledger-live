import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { ProductTourPortfolioMount } from ".";

const withOnboarding = (completed: boolean) => (state: State) => ({
  ...state,
  settings: { ...state.settings, hasCompletedOnboarding: completed },
});

describe("ProductTourPortfolioMount", () => {
  it("should render nothing when lwmProductTour is disabled", () => {
    const { toJSON } = render(<ProductTourPortfolioMount />, {
      overrideInitialState: withFlagOverrides(
        { lwmProductTour: { enabled: false } },
        withOnboarding(true),
      ),
    });

    expect(toJSON()).toBeNull();
  });

  it("should render nothing when onboarding is not complete", () => {
    const { toJSON } = render(<ProductTourPortfolioMount />, {
      overrideInitialState: withFlagOverrides(
        { lwmProductTour: { enabled: true } },
        withOnboarding(false),
      ),
    });

    expect(toJSON()).toBeNull();
  });

  it("should render the product tour subtree when flag is on and onboarding is complete", () => {
    render(<ProductTourPortfolioMount />, {
      overrideInitialState: withFlagOverrides(
        { lwmProductTour: { enabled: true } },
        withOnboarding(true),
      ),
    });

    expect(screen.getByTestId("product-tour-portfolio-mount")).toBeVisible();
  });
});
