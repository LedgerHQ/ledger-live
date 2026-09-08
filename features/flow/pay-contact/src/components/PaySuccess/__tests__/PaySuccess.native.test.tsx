import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { ContactIdSchema } from "@domain/entity-contact";
import { PaySuccess, type PaySuccessProps } from "../PaySuccess.native";
import { renderPaySuccess } from "./shared.native";

const baseProps: PaySuccessProps = {
  recipient: { id: ContactIdSchema.parse("contact-ada"), name: "Ada" },
  recipientLabel: "Ada",
  amountFormatted: "100 USDC",
  canViewTransaction: true,
  onViewTransaction: jest.fn(),
  onClose: jest.fn(),
};

function renderStep(overrides: Partial<PaySuccessProps> = {}) {
  return renderPaySuccess(<PaySuccess {...baseProps} {...overrides} />);
}

describe("PaySuccess (Native)", () => {
  it("should render the recipient headline and amount", () => {
    renderStep();

    expect(screen.getByTestId("pay-success-step")).toBeVisible();
    expect(screen.getByText("You paid (Ada)")).toBeVisible();
    expect(screen.getByText("100 USDC")).toBeVisible();
  });

  it("should fall back to a generic avatar when no contact is matched", () => {
    renderStep({ recipient: undefined, recipientLabel: "0x1ad2...c53034" });

    expect(screen.getByTestId("pay-success-step")).toBeVisible();
    expect(screen.getByText("You paid (0x1ad2...c53034)")).toBeVisible();
    expect(screen.getByText("100 USDC")).toBeVisible();
  });

  it("should hide the view transaction button when the operation is not available", () => {
    renderStep({ canViewTransaction: false });

    expect(screen.queryByTestId("pay-success-view-transaction")).not.toBeOnTheScreen();
  });

  it("should call onViewTransaction when the view transaction button is pressed", () => {
    const onViewTransaction = jest.fn();
    renderStep({ onViewTransaction });

    fireEvent.press(screen.getByTestId("pay-success-view-transaction"));

    expect(onViewTransaction).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when the header close button is pressed", () => {
    const onClose = jest.fn();
    renderStep({ onClose });

    fireEvent.press(screen.getByTestId("pay-success-header-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when the close button is pressed", () => {
    const onClose = jest.fn();
    renderStep({ onClose });

    fireEvent.press(screen.getByTestId("pay-success-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
