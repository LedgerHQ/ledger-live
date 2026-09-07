import React from "react";
import { render } from "@testing-library/react";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/casper/types";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock("~/renderer/components/Input", () => (props: Record<string, unknown>) => (
  <input data-testid="transfer-id-input" placeholder={props.placeholder as string} />
));

jest.mock("./hooks", () => ({
  useTransferIdChange: jest.fn().mockReturnValue(jest.fn()),
}));

import TransferIdField from "./TransferIdField";

const baseTx: Transaction = {
  family: "casper",
  amount: new BigNumber(0),
  recipient: "",
  fees: new BigNumber(0),
  useAllAmount: false,
};

const baseStatus: TransactionStatus = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(0),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
};

describe("TransferIdField", () => {
  it("renders without crashing for a casper transaction", () => {
    const { getByTestId } = render(
      <TransferIdField
        account={{} as Account}
        transaction={baseTx}
        status={baseStatus}
        onChange={jest.fn()}
      />,
    );

    expect(getByTestId("transfer-id-input")).toBeVisible();
  });

  it("throws when transaction family is not casper", () => {
    const wrongTx = { ...baseTx, family: "ethereum" } as unknown as Transaction;
    expect(() =>
      render(
        <TransferIdField
          account={{} as Account}
          transaction={wrongTx}
          status={baseStatus}
          onChange={jest.fn()}
        />,
      ),
    ).toThrow();
  });
});
