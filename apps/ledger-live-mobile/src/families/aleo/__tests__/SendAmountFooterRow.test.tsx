import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import SendAmountFooterRow from "../SendAmountFooterRow";

const aleoTransaction = {
  family: "aleo",
  amount: new BigNumber(0),
  recipient: "",
  fees: new BigNumber(0),
  mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
} as Transaction;

describe("SendAmountFooterRow", () => {
  it("GIVEN an Aleo transaction WHEN rendered THEN the estimated time row is shown", () => {
    render(<SendAmountFooterRow account={ALEO_ACCOUNT_1} transaction={aleoTransaction} />);

    expect(screen.getByTestId("send-estimated-time-row")).toBeOnTheScreen();
    expect(screen.getByText("Est. time")).toBeOnTheScreen();
    expect(screen.getByTestId("send-estimated-time-value")).toBeOnTheScreen();
  });

  it("GIVEN a transaction of another family WHEN rendered THEN nothing is shown", () => {
    const otherTransaction = { ...aleoTransaction, family: "bitcoin" } as unknown as Transaction;

    render(<SendAmountFooterRow account={ALEO_ACCOUNT_1} transaction={otherTransaction} />);

    expect(screen.queryByTestId("send-estimated-time-row")).toBeNull();
  });
});
