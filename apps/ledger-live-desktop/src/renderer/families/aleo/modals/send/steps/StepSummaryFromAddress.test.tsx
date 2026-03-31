import React from "react";
import { render, screen } from "tests/testSetup";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { ALEO_ACCOUNT_1 } from "../../../__mocks__/account.mock";
import { makeAleoTransaction } from "../../../__mocks__/transaction.mock";
import StepSummaryFromAddress from "./StepSummaryFromAddress";

jest.mock("./StepSummaryAddressBadge", () => () => <div data-testid="from-badge" />);

describe("StepSummaryFromAddress", () => {
  it("should render account name and from-direction badge", () => {
    render(
      <StepSummaryFromAddress
        account={ALEO_ACCOUNT_1}
        transaction={makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PRIVATE })}
      />,
    );

    expect(
      screen.getByText(`${ALEO_ACCOUNT_1.currency.name} ${ALEO_ACCOUNT_1.index + 1}`),
    ).toBeInTheDocument();
    expect(screen.getByTestId("from-badge")).toBeInTheDocument();
  });
});
