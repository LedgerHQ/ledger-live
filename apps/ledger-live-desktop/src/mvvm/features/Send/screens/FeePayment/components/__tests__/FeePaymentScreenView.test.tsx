/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import { FeePaymentScreenView } from "../FeePaymentScreenView";

jest.mock("@ledgerhq/lumen-ui-react", () => ({
  ...jest.requireActual("@ledgerhq/lumen-ui-react"),
  DialogBody: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  DialogFooter: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
}));

const LEARN_MORE_URL = "https://support.ledger.com/";
const onLearnMore = jest.fn();

const props = {
  options: [],
  disclaimer: "With Provider, a third-party energy provider, fees are paid in USDT.",
  learnMoreLabel: "Learn more",
  learnMoreUrl: LEARN_MORE_URL,
  onLearnMore,
  confirmLabel: "Confirm",
  confirmDisabled: false,
  onSelect: jest.fn(),
  onConfirm: jest.fn(),
};

describe("FeePaymentScreenView", () => {
  beforeEach(() => jest.clearAllMocks());

  it("ends the disclaimer with a Learn more link to the article", () => {
    render(<FeePaymentScreenView {...props} />);

    expect(screen.getByTestId("send-fee-payment-disclaimer")).toHaveTextContent(
      "With Provider, a third-party energy provider, fees are paid in USDT. Learn more",
    );
    expect(screen.getByTestId("send-fee-payment-learn-more")).toHaveAttribute(
      "href",
      LEARN_MORE_URL,
    );
  });

  it("opens the article through the view model instead of navigating", () => {
    render(<FeePaymentScreenView {...props} />);

    const navigated = fireEvent.click(screen.getByTestId("send-fee-payment-learn-more"));

    expect(navigated).toBe(false);
    expect(onLearnMore).toHaveBeenCalledTimes(1);
  });
});
