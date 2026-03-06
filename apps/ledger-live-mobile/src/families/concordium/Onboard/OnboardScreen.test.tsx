import React from "react";
import { render, screen } from "@tests/test-renderer";
import OnboardScreen from "./OnboardScreen";

describe("ConcordiumOnboardScreen", () => {
  it("should render the onboard title", () => {
    render(<OnboardScreen />);
    expect(screen.getByText("Concordium Onboarding")).toBeTruthy();
  });
});
