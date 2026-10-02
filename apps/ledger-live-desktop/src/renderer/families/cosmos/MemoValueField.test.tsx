import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { render, screen, fireEvent } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import type {
  CosmosAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cosmos/types";
import MemoValueField from "./MemoValueField";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>): Transaction =>
      ({
        ...tx,
        ...patch,
      }) as Transaction,
  }),
}));

const currency = getCryptoCurrencyById("cosmos");
const account = genAccount("cosmos-test", { currency }) as unknown as CosmosAccount;

const makeTransaction = (overrides?: Partial<Transaction>): Transaction =>
  ({
    family: "cosmos",
    mode: "send",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    ...overrides,
  }) as unknown as Transaction;

const makeStatus = (overrides: Partial<TransactionStatus> = {}): TransactionStatus =>
  ({
    errors: {},
    warnings: {},
    ...overrides,
  }) as TransactionStatus;

const defaultState = {
  settings: AFTER_ONBOARDING_STATE,
  accounts: [account],
};

describe("MemoValueField", () => {
  it("renders the memo text input", () => {
    render(
      <MemoValueField
        account={account}
        transaction={makeTransaction()}
        onChange={jest.fn()}
        status={makeStatus()}
      />,
      { initialState: defaultState },
    );
    expect(screen.getByTestId("memo-tag-input")).toBeVisible();
  });

  it("displays the current memo value", () => {
    render(
      <MemoValueField
        account={account}
        transaction={makeTransaction({ memo: "prefilled memo" })}
        onChange={jest.fn()}
        status={makeStatus()}
      />,
      { initialState: defaultState },
    );
    expect(screen.getByTestId("memo-tag-input")).toHaveValue("prefilled memo");
  });

  it("calls onChange with the updated transaction when the user types", () => {
    const handleChange = jest.fn();

    render(
      <MemoValueField
        account={account}
        transaction={makeTransaction({ memo: "" })}
        onChange={handleChange}
        status={makeStatus()}
      />,
      { initialState: defaultState },
    );

    fireEvent.change(screen.getByTestId("memo-tag-input"), { target: { value: "payment ref" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        memo: "payment ref",
        memoType: "text",
        memoValue: "payment ref",
      }),
    );
  });
});
