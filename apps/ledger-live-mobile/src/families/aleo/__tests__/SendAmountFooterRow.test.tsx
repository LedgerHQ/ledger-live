import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getAleoCurrencyConfigById } from "@ledgerhq/live-common/families/aleo/config";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import SendAmountFooterRow from "../SendAmountFooterRow";

jest.mock("@ledgerhq/live-common/families/aleo/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/aleo/config"),
  getAleoCurrencyConfigById: jest.fn(),
}));

const mockedGetAleoCurrencyConfigById = jest.mocked(getAleoCurrencyConfigById);

type AleoCoinConfig = NonNullable<ReturnType<typeof getAleoCurrencyConfigById>>;

const publicTransaction = {
  family: "aleo",
  amount: new BigNumber(0),
  recipient: "",
  fees: new BigNumber(0),
  mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
} as Transaction;

const privateTransaction = {
  ...publicTransaction,
  mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
  properties: { amountRecordCommitments: ["record-0"], feeRecordCommitment: "fee-record" },
} as Transaction;

describe("SendAmountFooterRow", () => {
  beforeEach(() => {
    mockedGetAleoCurrencyConfigById.mockReturnValue({
      recordPickingStrategy: "auto",
    } as AleoCoinConfig);
  });

  it("GIVEN a private Aleo transaction WHEN rendered THEN the signing time row is shown", () => {
    render(<SendAmountFooterRow account={ALEO_ACCOUNT_1} transaction={privateTransaction} />);

    expect(screen.getByTestId("send-estimated-time-row")).toBeOnTheScreen();
    expect(screen.getAllByText("Signing time")[0]).toBeOnTheScreen();
    expect(screen.getByTestId("send-estimated-time-value")).toBeOnTheScreen();
  });

  it("GIVEN a public Aleo transaction WHEN rendered THEN nothing is shown", () => {
    render(<SendAmountFooterRow account={ALEO_ACCOUNT_1} transaction={publicTransaction} />);

    expect(screen.queryByTestId("send-estimated-time-row")).toBeNull();
  });

  it("GIVEN a transaction of another family WHEN rendered THEN nothing is shown", () => {
    const otherTransaction = { ...privateTransaction, family: "bitcoin" } as unknown as Transaction;

    render(<SendAmountFooterRow account={ALEO_ACCOUNT_1} transaction={otherTransaction} />);

    expect(screen.queryByTestId("send-estimated-time-row")).toBeNull();
  });
});
