import React from "react";
import { render, screen } from "@testing-library/react";
import { AddressNameDisclaimer } from "./AddressNameDisclaimer.web";

describe("AddressNameDisclaimer", () => {
  it("should render an accessible tooltip trigger with its description", () => {
    render(
      <AddressNameDisclaimer
        accessibilityLabel="Address name information"
        description="This name appears on your Ledger device."
      />,
    );

    expect(screen.getByRole("button", { name: "Address name information" })).toBeVisible();
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "This name appears on your Ledger device.",
    );
  });
});
