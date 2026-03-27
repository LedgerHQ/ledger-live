import React from "react";
import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Operation } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { render } from "@tests/test-renderer";
import { track } from "~/analytics";
import { ScreenName } from "~/const";
import OperationsListItem from "..";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");
const account = genAccount("operations-list-item-test", { currency: bitcoin });

function buildOperation(overrides: Partial<Operation>): Operation {
  return {
    id: "operations-list-item-op",
    hash: "abc",
    type: "IN",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: 1,
    blockHash: "block",
    accountId: account.id,
    date: new Date("2024-06-01T12:00:00.000Z"),
    extra: {},
    ...overrides,
  };
}

describe("OperationsListItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the translated title for the operation type", () => {
    const operation = buildOperation({ type: "IN" });
    const { getByText } = render(
      <OperationsListItem operation={operation} account={account} parentAccount={undefined} />,
    );
    expect(getByText("Received")).toBeVisible();
  });

  it("should render send or receive subtitle with from label when incoming and sender is present", () => {
    const operation = buildOperation({
      type: "IN",
      value: new BigNumber(1),
      senders: ["12345678901234567890"],
    });
    const { getByText } = render(
      <OperationsListItem operation={operation} account={account} parentAccount={undefined} />,
    );
    expect(getByText("From 123456...7890")).toBeVisible();
  });

  it("should render send or receive subtitle with to label when outgoing and recipient is present", () => {
    const operation = buildOperation({
      type: "OUT",
      value: new BigNumber(1),
      recipients: ["abcdefghijklmnopqrs"],
    });
    const { getByText } = render(
      <OperationsListItem operation={operation} account={account} parentAccount={undefined} />,
    );
    expect(getByText("To abcdef...pqrs")).toBeVisible();
  });

  it("should render only the formatted address when the operation is not send or receive", () => {
    const operation = buildOperation({
      type: "REGISTER",
      senders: ["12345678901234567890"],
    });
    const { getByText } = render(
      <OperationsListItem operation={operation} account={account} parentAccount={undefined} />,
    );
    expect(getByText("123456...7890")).toBeVisible();
  });

  it("should not render the amount column when the operation amount is zero", () => {
    const operation = buildOperation({ type: "REGISTER" });
    const { queryByText } = render(
      <OperationsListItem operation={operation} account={account} parentAccount={undefined} />,
    );
    expect(queryByText(/^\+1(\.0+)?\s*BTC$/)).toBeNull();
  });

  it("should render the amount when the operation amount is not zero", () => {
    const operation = buildOperation({
      type: "IN",
      value: new BigNumber(100000000),
    });
    const { getByText } = render(
      <OperationsListItem operation={operation} account={account} parentAccount={undefined} />,
    );
    expect(getByText(/^\+1(\.0+)?\s*BTC$/)).toBeVisible();
  });

  it("should navigate to operation details and track when the row is pressed", async () => {
    const operation = buildOperation({
      type: "IN",
      value: new BigNumber(1),
      senders: ["s"],
    });
    const { getByText, user } = render(
      <OperationsListItem operation={operation} account={account} parentAccount={undefined} />,
    );
    await user.press(getByText("Received"));
    expect(track).toHaveBeenCalledWith("transaction_clicked", { transaction: "IN" });
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OperationDetails, {
      accountId: account.id,
      parentId: undefined,
      operation,
      key: operation.id,
    });
  });

  it("should not navigate when the operation is optimistic", async () => {
    const operation = buildOperation({
      type: "IN",
      value: new BigNumber(1),
      senders: ["s"],
      blockHeight: null,
    });
    const { getByText, user } = render(
      <OperationsListItem operation={operation} account={account} parentAccount={undefined} />,
    );
    await user.press(getByText("Received"));
    expect(track).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should pass parentId when parentAccount is provided", async () => {
    const parentAccount = { ...account, id: "parent-account-id" };
    const operation = buildOperation({
      type: "IN",
      value: new BigNumber(1),
      senders: ["s"],
    });
    const { getByText, user } = render(
      <OperationsListItem operation={operation} account={account} parentAccount={parentAccount} />,
    );
    await user.press(getByText("Received"));
    expect(mockNavigate).toHaveBeenCalledWith(
      ScreenName.OperationDetails,
      expect.objectContaining({ parentId: "parent-account-id" }),
    );
  });
});
