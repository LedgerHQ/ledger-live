import React from "react";
import { render, screen } from "tests/testSetup";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type { Transaction as AleoTransaction } from "@ledgerhq/live-common/families/aleo/types";
import SendAmountFooterRow from "../SendAmountFooterRow";
import { ALEO_MAIN_ACCOUNT } from "../__mocks__/account.mock";
import { mockAleoCoinConfig } from "../__mocks__/config.mock";
import { makeAleoTransaction } from "../__mocks__/transaction.mock";
import { getAleoCurrencyConfig } from "../shared/utils";

jest.mock("../shared/utils", () => ({
  ...jest.requireActual("../shared/utils"),
  getAleoCurrencyConfig: jest.fn(),
}));

const mockGetAleoCurrencyConfig = jest.mocked(getAleoCurrencyConfig);

type PrivateTransferOverrides = Partial<
  Extract<AleoTransaction, { mode: typeof TRANSACTION_TYPE.TRANSFER_PRIVATE }>
>;

const makePrivateTransaction = (amountRecordCount: number, feeRecordCommitment: string | null) => {
  const overrides: PrivateTransferOverrides = {
    mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
    properties: {
      amountRecordCommitments: Array.from({ length: amountRecordCount }, (_, i) => `record-${i}`),
      feeRecordCommitment,
    },
  };
  return makeAleoTransaction(overrides);
};

const renderRow = (transaction: AleoTransaction) =>
  render(<SendAmountFooterRow account={ALEO_MAIN_ACCOUNT} transaction={transaction} />);

describe("Aleo SendAmountFooterRow", () => {
  beforeEach(() => {
    mockGetAleoCurrencyConfig.mockReturnValue({
      ...mockAleoCoinConfig,
      recordPickingStrategy: "auto",
    });
  });

  it("renders nothing when records are picked manually", () => {
    mockGetAleoCurrencyConfig.mockReturnValue(mockAleoCoinConfig);

    const { container } = renderRow(makePrivateTransaction(2, "fee-record"));

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a public send", () => {
    const { container } = renderRow(
      makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC }),
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("counts the records of a private send, fee record included", () => {
    renderRow(makePrivateTransaction(2, "fee-record"));

    expect(screen.getByText("Est. time")).toBeVisible();
    expect(screen.getByTestId("aleo-send-estimated-time-value")).toHaveTextContent("~38 sec");
  });

  it("renders nothing before any record is picked", () => {
    const { container } = renderRow(makePrivateTransaction(0, null));

    expect(container).toBeEmptyDOMElement();
  });

  it("leaves a sponsored fee out of the count", () => {
    renderRow(makePrivateTransaction(2, null));

    expect(screen.getByTestId("aleo-send-estimated-time-value")).toHaveTextContent("~25 sec");
  });

  it("follows the records picked for a new amount", () => {
    const { rerender } = renderRow(makePrivateTransaction(1, "fee-record"));
    expect(screen.getByTestId("aleo-send-estimated-time-value")).toHaveTextContent("~25 sec");

    rerender(
      <SendAmountFooterRow
        account={ALEO_MAIN_ACCOUNT}
        transaction={makePrivateTransaction(7, "fee-record")}
      />,
    );

    expect(screen.getByTestId("aleo-send-estimated-time-value")).toHaveTextContent("~1.5 min");
  });

  it("explains the estimate on hover", async () => {
    const { user } = renderRow(makePrivateTransaction(1, "fee-record"));

    await user.hover(screen.getByTestId("aleo-send-estimated-time-info"));

    expect(
      await screen.findByRole("tooltip", { name: /each one adds processing time/ }),
    ).toBeInTheDocument();
  });

  it("explains the estimate on keyboard focus", async () => {
    const { user } = renderRow(makePrivateTransaction(1, "fee-record"));

    await user.tab();

    expect(screen.getByRole("button", { name: "Est. time" })).toHaveFocus();
    expect(
      await screen.findByRole("tooltip", { name: /each one adds processing time/ }),
    ).toBeInTheDocument();
  });
});
