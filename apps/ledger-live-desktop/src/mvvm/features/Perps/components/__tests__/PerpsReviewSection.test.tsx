import React from "react";
import { render, screen } from "tests/testSetup";
import { PerpsReviewSection } from "../PerpsReviewSection";

describe("PerpsReviewSection", () => {
  it("shows the translated title and each detail row", () => {
    render(
      <PerpsReviewSection
        titleKey="perpsReview.swapDetailTitle"
        details={[
          { labelKey: "perpsReview.amountSendLabel", value: "500 USDC", testID: "row-send" },
          { labelKey: "perpsReview.amountReceiveLabel", value: "~0.3 ETH", testID: "row-receive" },
        ]}
      />,
    );

    expect(screen.getByText("Swap details")).toBeVisible();
    expect(screen.getByTestId("row-send")).toHaveTextContent("Amount send500 USDC");
    expect(screen.getByTestId("row-receive")).toHaveTextContent("Amount receive~0.3 ETH");
  });
});
