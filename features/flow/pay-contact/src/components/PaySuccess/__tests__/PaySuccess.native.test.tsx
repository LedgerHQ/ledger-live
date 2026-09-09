import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { ContactIdSchema } from "@domain/entity-contact";
import { PaySuccess, type PaySuccessProps } from "../PaySuccess.native";
import { renderPaySuccess } from "./shared.native";

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

describe("PaySuccess (Native)", () => {
  it("should render the recipient headline, amount and from account", () => {
    renderStep();

    expect(screen.getByTestId("pay-success-step")).toBeVisible();
    expect(screen.getByText("You paid (Ada)")).toBeVisible();
    expect(screen.getAllByText("100 USDC").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Ethereum 1")).toBeVisible();
  });

  it("should show the network icon on the From row", () => {
    renderStep();

    expect(screen.getByTestId("pay-success-summary-icon")).toBeVisible();
  });

  it("should hide the estimated time row when it is not provided", () => {
    renderStep();

    expect(screen.queryByText("Est. time")).not.toBeOnTheScreen();
  });

  it("should show the estimated time row when it is provided", () => {
    renderStep({ estimatedTime: "~15s" });

    expect(screen.getByText("Est. time")).toBeVisible();
    expect(screen.getByText("~15s")).toBeVisible();
  });

  it("should fall back to a generic avatar when no contact is matched", () => {
    renderStep({ recipient: undefined, recipientLabel: "0x1ad2...c53034" });

    expect(screen.getByTestId("pay-success-step")).toBeVisible();
    expect(screen.getByText("You paid (0x1ad2...c53034)")).toBeVisible();
    expect(screen.getAllByText("100 USDC").length).toBeGreaterThanOrEqual(2);
  });

  it("should call onViewTransaction when the view transaction button is pressed", () => {
    const onViewTransaction = jest.fn();
    renderStep({ onViewTransaction });

    fireEvent.press(screen.getByTestId("pay-success-view-transaction"));

    expect(onViewTransaction).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when the close button is pressed", () => {
    const onClose = jest.fn();
    renderStep({ onClose });

    fireEvent.press(screen.getByTestId("pay-success-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
