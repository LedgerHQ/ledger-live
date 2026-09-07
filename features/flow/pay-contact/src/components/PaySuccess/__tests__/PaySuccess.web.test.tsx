import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { ContactIdSchema } from "@domain/entity-contact";
import { PaySuccess, type PaySuccessProps } from "../PaySuccess.web";
import { renderPaySuccess } from "./shared.web";

const baseProps: PaySuccessProps = {
  recipient: { id: ContactIdSchema.parse("contact-ada"), name: "Ada", isMe: false },
  recipientLabel: "Ada",
  amountFormatted: "100 USDC",
  fromAccountName: "Ethereum 1",
  networkIcon: { ledgerId: "ethereum", ticker: "ETH" },
  onViewTransaction: jest.fn(),
  onClose: jest.fn(),
};

function renderStep(overrides: Partial<PaySuccessProps> = {}) {
  return renderPaySuccess(<PaySuccess {...baseProps} {...overrides} />);
}

describe("PaySuccess (Web)", () => {
  it("renders the recipient headline, amount and from account", () => {
    renderStep();

    expect(screen.getByTestId("pay-success-step")).toBeVisible();
    expect(screen.getByText(/You paid/)).toHaveTextContent("You paid (Ada) 100 USDC");
    expect(screen.getByText("Ethereum 1")).toBeVisible();
  });

  it("shows the network icon on the From row", () => {
    renderStep();

    expect(screen.getByTestId("pay-success-summary-icon")).toBeVisible();
  });

  it("hides the estimated time row when it is not provided", () => {
    renderStep();

    expect(screen.queryByText("Est. time")).not.toBeInTheDocument();
  });

  it("shows the estimated time row when it is provided", () => {
    renderStep({ estimatedTime: "~15s" });

    expect(screen.getByText("Est. time")).toBeVisible();
    expect(screen.getByText("~15s")).toBeVisible();
  });

  it("falls back to a generic avatar when no contact is matched", () => {
    renderStep({ recipient: undefined, recipientLabel: "0x1ad2...c53034" });

    expect(screen.getByTestId("pay-success-step")).toBeVisible();
    expect(screen.getByText(/You paid/)).toHaveTextContent("You paid (0x1ad2...c53034) 100 USDC");
  });

  it("calls onViewTransaction when the primary CTA is clicked", () => {
    const onViewTransaction = jest.fn();
    renderStep({ onViewTransaction });

    fireEvent.click(screen.getByTestId("pay-success-view-transaction"));

    expect(onViewTransaction).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close CTA is clicked", () => {
    const onClose = jest.fn();
    renderStep({ onClose });

    fireEvent.click(screen.getByTestId("pay-success-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
