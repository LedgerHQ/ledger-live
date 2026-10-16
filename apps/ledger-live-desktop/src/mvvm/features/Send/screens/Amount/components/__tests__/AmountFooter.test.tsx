/**
 * @jest-environment jsdom
 */
import React from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { render, screen } from "tests/testSetup";
import { createMockAccount } from "../../../Recipient/__integrations__/__fixtures__/accounts";
import { AmountFooter } from "../AmountFooter";

const mockTronAccount = createMockAccount({ currency: getCryptoCurrencyById("tron") });
jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({
    state: {
      account: { account: mockTronAccount, parentAccount: null },
      transaction: { transaction: { family: "tron" }, status: null },
    },
  }),
}));

const baseProps: React.ComponentProps<typeof AmountFooter> = {
  feesRowLabel: "Network fees",
  feesRowValue: "6.43 TRX",
  feesRowSecondaryValue: null,
  feesRowStrategyLabel: "",
  feeSelector: { options: [], selectedId: "", canOpen: false },
  sponsoredNudge: { available: false, selected: false, label: null, onOpen: jest.fn() },
  sponsoredFee: null,
  reviewLabel: "Review",
  reviewShowIcon: true,
  reviewDisabled: false,
  reviewLoading: false,
  sponsoredFeeError: null,
  sponsoredRentNotice: null,
  onReview: jest.fn(),
};

describe("AmountFooter", () => {
  it("tells the user a rent is still arriving, as a neutral status message", () => {
    render(<AmountFooter {...baseProps} sponsoredRentNotice="Your energy rental is on its way." />);

    const notice = screen.getByTestId("send-sponsored-rent-arriving");
    expect(notice).toBeVisible();
    expect(notice).toHaveTextContent("Your energy rental is on its way.");
    expect(notice).toHaveClass("text-base");
    expect(screen.getByRole("status")).toContainElement(notice);
  });

  it("renders no rent notice when none is given", () => {
    render(<AmountFooter {...baseProps} />);

    expect(screen.queryByTestId("send-sponsored-rent-arriving")).toBeNull();
    expect(screen.getByTestId("send-network-fees-row")).toHaveTextContent("6.43 TRX");
  });

  it("shows the rent notice next to a fee error rather than in place of it", () => {
    render(
      <AmountFooter
        {...baseProps}
        sponsoredFeeError="Not enough USDT."
        sponsoredRentNotice="Your energy rental is on its way."
      />,
    );

    expect(screen.getByTestId("send-sponsored-fee-error")).toHaveTextContent("Not enough USDT.");
    expect(screen.getByTestId("send-sponsored-rent-arriving")).toBeVisible();
  });
});
