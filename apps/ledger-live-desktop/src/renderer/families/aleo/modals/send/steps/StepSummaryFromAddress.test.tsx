import React from "react";
import { render, screen } from "@testing-library/react";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { ALEO_ACCOUNT_1 } from "../../../__mocks__/account.mock";
import { makeAleoTransaction } from "../../../__mocks__/transaction.mock";
import StepSummaryFromAddress from "./StepSummaryFromAddress";

jest.mock("./StepSummaryAddressBadge", () => () => <div data-testid="from-badge" />);
jest.mock("~/renderer/reducers/wallet", () => ({
  ...jest.requireActual("~/renderer/reducers/wallet"),
  useMaybeAccountName: jest.fn(() => "From account"),
}));

describe("StepSummaryFromAddress", () => {
  it("should render account name and from-direction badge", () => {
    render(
      <StepSummaryFromAddress
        account={ALEO_ACCOUNT_1}
        parentAccount={undefined}
        transaction={makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PRIVATE })}
      />,
    );

    expect(screen.getByText("From account")).toBeInTheDocument();
    expect(screen.getByTestId("from-badge")).toBeInTheDocument();
  });
});
