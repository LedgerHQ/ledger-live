import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { DesyncOverlay } from "../components/DesyncOverlay";

describe("DesyncOverlay", () => {
  it("should show desync overlay", async () => {
    render(<DesyncOverlay isOpen productName="stax" />);

    await waitFor(() => expect(screen.getByTestId("onboarding-desync-overlay")).toBeVisible(), {
      timeout: 1000,
    });
  });

  it("should wait for delay before displaying desync overly", async () => {
    render(<DesyncOverlay isOpen productName="stax" delay={1000} />);

    const overlay = screen.queryByTestId("onboarding-desync-overlay");

    expect(overlay).toBeNull();

    await waitFor(() => expect(screen.queryByTestId("onboarding-desync-overlay")).toBeVisible(), {
      timeout: 2000,
    });
  });
});
