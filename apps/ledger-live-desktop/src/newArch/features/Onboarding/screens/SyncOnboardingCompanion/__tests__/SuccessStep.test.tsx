import React from "react";
import { render, screen } from "tests/testSetup";

import SuccessStep from "../components/SuccessStep";

describe("SuccessStep", () => {
  it("should open add account modal when secure my crypto step clicked", async () => {
    render(<SuccessStep deviceName="Stax" />);

    const secureText = screen.getByText("Your Stax is now ready to secure your crypto");

    expect(secureText).toBeVisible();
  });
});
