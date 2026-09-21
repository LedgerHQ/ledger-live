import React from "react";
import type { Card } from "@braze/web-sdk";
import { render, screen } from "tests/testSetup";
import { EligibilityInspect } from "../Modal/EligibilityInspect";

const mockUseBraze = jest.fn();

jest.mock("LLD/features/DynamicContent/components/BrazeProvider", () => ({
  useBraze: () => mockUseBraze(),
}));

const emptyEligibilityContext = {
  hasFunds: false,
  isOnboarded: false,
  hasStax: false,
};

describe("EligibilityInspect", () => {
  beforeEach(() => {
    mockUseBraze.mockReturnValue({
      lastFetchedCards: null,
      eligibilityEvaluations: [],
      eligibilityContext: emptyEligibilityContext,
      injectDebugContentCard: () => {},
      prepareForIdentityTransition: () => {},
      refreshContentCards: () => Promise.resolve(),
    });
  });

  it("should label a fetched card without an id as unevaluated, not eligible", () => {
    mockUseBraze.mockReturnValue({
      lastFetchedCards: [{ extras: { title: "No id card" } } as unknown as Card],
      eligibilityEvaluations: [],
      eligibilityContext: emptyEligibilityContext,
      injectDebugContentCard: () => {},
      prepareForIdentityTransition: () => {},
      refreshContentCards: () => Promise.resolve(),
    });

    render(<EligibilityInspect />);

    expect(screen.getByText("Fetched from Braze: 1")).toBeVisible();
    expect(screen.getByText("Eligible: 0")).toBeVisible();
    expect(screen.getByText("Unevaluated: 1")).toBeVisible();
    expect(screen.getByText("unevaluated (missing id)")).toBeVisible();
    expect(screen.queryByText("eligible")).not.toBeInTheDocument();
  });
});
