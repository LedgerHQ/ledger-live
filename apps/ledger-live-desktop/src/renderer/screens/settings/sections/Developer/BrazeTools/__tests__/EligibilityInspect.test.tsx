import React from "react";
import type { Card } from "@braze/web-sdk";
import { render, screen } from "tests/testSetup";
import { EligibilityInspect } from "../Modal/EligibilityInspect";

const mockUseBraze = jest.fn();
const injectDebugContentCard = jest.fn();

jest.mock("LLD/features/DynamicContent/components/BrazeProvider", () => ({
  useBraze: () => mockUseBraze(),
}));

const emptyEligibilityContext = {
  hasFunds: false,
  isOnboarded: true,
  hasStax: false,
};

const lifecycle = {
  injectDebugContentCard,
  prepareForIdentityTransition: () => {},
  refreshContentCards: () => Promise.resolve(),
};

describe("EligibilityInspect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBraze.mockReturnValue({
      lastFetchedCards: null,
      eligibilityEvaluations: [],
      eligibilityContext: emptyEligibilityContext,
      ...lifecycle,
    });
  });

  it("should show the empty fetched cards state and snapshot values", () => {
    render(<EligibilityInspect />);

    expect(screen.getByText("No fetched cards.")).toBeVisible();
    expect(screen.getByText("Fetched from Braze: 0")).toBeVisible();
    expect(screen.getAllByText("yes")).toHaveLength(1);
    expect(screen.getAllByText("no")).toHaveLength(2);
  });

  it("should label a fetched card without an id as unevaluated, not eligible", () => {
    mockUseBraze.mockReturnValue({
      lastFetchedCards: [{ extras: { title: "No id card" } } as unknown as Card],
      eligibilityEvaluations: [],
      eligibilityContext: emptyEligibilityContext,
      ...lifecycle,
    });

    render(<EligibilityInspect />);

    expect(screen.getByText("Fetched from Braze: 1")).toBeVisible();
    expect(screen.getByText("Eligible: 0")).toBeVisible();
    expect(screen.getByText("Unevaluated: 1")).toBeVisible();
    expect(screen.getByText("unevaluated (missing id)")).toBeVisible();
    expect(screen.queryByText("eligible")).not.toBeInTheDocument();
  });

  it("should show blockedBy when requiredStates are unmet", () => {
    mockUseBraze.mockReturnValue({
      lastFetchedCards: [{ id: "debug-stax", extras: { title: "Debug Stax" } } as unknown as Card],
      eligibilityEvaluations: [
        {
          id: "debug-stax",
          requiredStates: ["hasStax"],
          result: { eligible: false, blockedBy: "hasStax", reason: "unmet-state" },
        },
      ],
      eligibilityContext: emptyEligibilityContext,
      ...lifecycle,
    });

    render(<EligibilityInspect />);

    expect(screen.getByText("Removed (local eligibility): 1")).toBeVisible();
    expect(screen.getByText("blockedBy: hasStax (unmet-state)")).toBeVisible();
  });

  it("should show eligible when the evaluation passes", () => {
    mockUseBraze.mockReturnValue({
      lastFetchedCards: [
        { id: "debug-ok", extras: { title: "Always eligible card" } } as unknown as Card,
      ],
      eligibilityEvaluations: [
        {
          id: "debug-ok",
          requiredStates: [],
          result: { eligible: true },
        },
      ],
      eligibilityContext: emptyEligibilityContext,
      ...lifecycle,
    });

    render(<EligibilityInspect />);

    expect(screen.getByText("Eligible: 1")).toBeVisible();
    expect(screen.getByText("eligible")).toBeVisible();
    expect(screen.getByText("requiredStates: none")).toBeVisible();
  });

  it("should label a card with an id but no evaluation as unevaluated", () => {
    mockUseBraze.mockReturnValue({
      lastFetchedCards: [{ id: "orphan", extras: { title: "Orphan card" } } as unknown as Card],
      eligibilityEvaluations: [],
      eligibilityContext: emptyEligibilityContext,
      ...lifecycle,
    });

    render(<EligibilityInspect />);

    expect(screen.getByText("unevaluated")).toBeVisible();
  });

  it("should inject a debug card with trimmed requiredStates", async () => {
    const { user } = render(<EligibilityInspect />);

    await user.click(screen.getByRole("button", { name: "Inject into fetch cache" }));

    expect(injectDebugContentCard).toHaveBeenCalledWith({
      extras: {
        title: "Debug eligibility card",
        location: "portfolio",
        requiredStates: "hasStax",
      },
    });
  });
});
