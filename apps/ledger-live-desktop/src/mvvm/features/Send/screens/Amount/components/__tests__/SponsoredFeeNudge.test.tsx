/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { SponsoredFeeNudge, type SponsoredFeeNudgeProps } from "../Fees/SponsoredFeeNudge";

const baseProps: Omit<SponsoredFeeNudgeProps, "onOpen"> = {
  available: true,
  selected: false,
  label: "You could save $1.20 with Provider",
};

describe("SponsoredFeeNudge", () => {
  it("should confirm the savings with a badge when the sponsored option is selected", () => {
    render(<SponsoredFeeNudge {...baseProps} selected label="Saved with Provider" />);

    const badge = screen.getByTestId("send-sponsored-fee-saved-badge");
    expect(badge).toBeVisible();
    expect(badge).toHaveTextContent("Saved with Provider");
    expect(screen.queryByTestId("send-sponsored-fee-nudge")).toBeNull();
  });

  it("should offer the sponsored option as a nudge when the standard option is selected", () => {
    render(<SponsoredFeeNudge {...baseProps} />);

    expect(screen.getByTestId("send-sponsored-fee-nudge")).toHaveTextContent(
      "You could save $1.20 with Provider",
    );
    expect(screen.queryByTestId("send-sponsored-fee-saved-badge")).toBeNull();
  });

  it.each([
    ["the sponsored option is unavailable", { available: false }],
    ["there is nothing to say", { label: null }],
  ])("should render nothing when %s", (_, overrides) => {
    render(<SponsoredFeeNudge {...baseProps} {...overrides} />);

    expect(screen.queryByTestId("send-sponsored-fee-saved-badge")).toBeNull();
    expect(screen.queryByTestId("send-sponsored-fee-nudge")).toBeNull();
  });
});
