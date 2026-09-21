import React from "react";
import { render, screen } from "tests/testSetup";
import { ModalBody } from "../Modal/Body";

jest.mock("LLD/features/DynamicContent/components/BrazeProvider", () => ({
  useBraze: () => ({
    lastFetchedCards: null,
    eligibilityEvaluations: [],
    eligibilityContext: { hasFunds: false, isOnboarded: true, hasStax: false },
    injectDebugContentCard: () => {},
    prepareForIdentityTransition: () => {},
    refreshContentCards: () => Promise.resolve(),
  }),
}));

jest.mock("../Hooks/useGenerateLocalBraze", () => ({
  useGenerateLocalBraze: () => ({
    addLocalPortfolioCard: jest.fn(),
    addLocalBottomPortfolioCard: jest.fn(),
    addLocalActionCard: jest.fn(),
    addLocalNotificationCard: jest.fn(),
    addLocalHardwareCarouselCard: jest.fn(),
    seedHardwareCarouselSample: jest.fn(),
    dismissLocalCards: jest.fn(),
  }),
}));

describe("BrazeTools ModalBody", () => {
  it("should open on the Inspect tab", () => {
    render(<ModalBody />);

    expect(screen.getByText("Local eligibility")).toBeVisible();
    expect(screen.getByText("No fetched cards.")).toBeVisible();
  });

  it("should switch to the notification inject form", async () => {
    const { user } = render(<ModalBody />);

    await user.click(screen.getByRole("button", { name: "Notification Content Card" }));

    expect(screen.getByDisplayValue("Dummy Title")).toBeVisible();
    expect(screen.queryByText("Local eligibility")).not.toBeInTheDocument();
  });

  it("should switch to the small card carousel builder", async () => {
    const { user } = render(<ModalBody />);

    await user.click(screen.getByRole("button", { name: "Small card carousel" }));

    expect(screen.getByText("Container title")).toBeVisible();
    expect(screen.queryByText("Dummy Title")).not.toBeInTheDocument();
  });
});
