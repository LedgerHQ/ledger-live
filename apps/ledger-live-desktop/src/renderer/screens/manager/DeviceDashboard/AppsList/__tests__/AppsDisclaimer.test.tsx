import React from "react";
import { render, screen } from "tests/testSetup";
import AppsDisclaimer from "../AppsDisclaimer";

describe("AppsDisclaimer", () => {
  it("shows the full community apps disclaimer", () => {
    render(<AppsDisclaimer />);
    const disclaimer = screen.getByTestId("manager-apps-disclaimer");
    expect(disclaimer).toHaveTextContent(
      "Ledger does not develop, review, audit, endorse or maintain these applications",
    );
    expect(disclaimer).toHaveTextContent(
      "Maintenance, updates and support are the sole responsibility of the respective third-party publisher.",
    );
  });
});
