import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import type { CeloAccount, Transaction } from "@ledgerhq/live-common/families/celo/types";
import StepAmount from "../StepAmount";
import { StepProps } from "../../types";

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  Trans: ({ i18nKey, values }: { i18nKey: string; values?: { date?: string } }) => (
    <span>
      {i18nKey}
      {values?.date ? ` ${values.date}` : ""}
    </span>
  ),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (t: Transaction, patch: Partial<Transaction>) => ({ ...t, ...patch }),
  }),
}));

const nowSeconds = Math.floor(Date.now() / 1000);

const account = {
  type: "Account",
  id: "celo-account-1",
  currency: {
    type: "CryptoCurrency",
    id: "celo",
    name: "Celo",
    ticker: "CELO",
    family: "celo",
    units: [{ name: "CELO", code: "CELO", magnitude: 18 }],
  },
  celoResources: {
    pendingWithdrawals: [
      { value: new BigNumber("9e18"), time: new BigNumber(nowSeconds - 86400), index: 0 },
      { value: new BigNumber("2e18"), time: new BigNumber(nowSeconds + 86400), index: 1 },
    ],
  },
} as unknown as CeloAccount;

const transaction = { family: "celo", mode: "withdraw", index: 0 } as Transaction;

describe("StepAmount", () => {
  it("labels each pending withdrawal row with its unlock date", () => {
    render(
      <StepAmount
        {...({} as StepProps)}
        account={account}
        transaction={transaction}
        onChangeTransaction={jest.fn()}
      />,
    );

    expect(screen.getByText(/^celo\.withdraw\.steps\.amount\.unlockedOn \S/)).toBeInTheDocument();
    expect(screen.getByText(/^celo\.withdraw\.steps\.amount\.unlocksOn \S/)).toBeInTheDocument();
  });
});
