import React from "react";
import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { AccountLike, Operation } from "@ledgerhq/types-live";
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
const emptyMap = new Map<string, AccountLike>();

// getDefaultAccountName(account) = `${currency.name} ${index + 1}` = "Bitcoin 2"
// genAccount always uses index: 1, so all generated Bitcoin accounts share this default name.
const DEFAULT_ACCOUNT_NAME = `${bitcoin.name} ${account.index + 1}`;

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

function renderItem(operation: Operation, accountByAddress = emptyMap) {
  return render(
    <OperationsListItem
      operation={operation}
      account={account}
      parentAccount={undefined}
      accountByAddress={accountByAddress}
    />,
  );
}

describe("OperationsListItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the translated title for the operation type", () => {
    const { getByText } = renderItem(buildOperation({ type: "IN" }));
    expect(getByText("Received")).toBeVisible();
  });

  it("should render send or receive subtitle with from label when incoming and sender is present", () => {
    const { getByText } = renderItem(
      buildOperation({ type: "IN", value: new BigNumber(1), senders: ["12345678901234567890"] }),
    );
    expect(getByText("From 123456...7890")).toBeVisible();
  });

  it("should render send or receive subtitle with to label when outgoing and recipient is present", () => {
    const { getByText } = renderItem(
      buildOperation({ type: "OUT", value: new BigNumber(1), recipients: ["abcdefghijklmnopqrs"] }),
    );
    expect(getByText("To abcdef...pqrs")).toBeVisible();
  });

  it("should show own account name for non-send/receive operations", () => {
    const { getByText } = renderItem(buildOperation({ type: "REGISTER" }));
    expect(getByText(`${DEFAULT_ACCOUNT_NAME}`)).toBeVisible();
  });

  describe("internal transfers", () => {
    const counterpartyAccount = genAccount("internal-counterparty", { currency: bitcoin });
    const counterpartyName = `${bitcoin.name} ${counterpartyAccount.index + 1}`;

    it("should show internal account name instead of address for an incoming transfer", () => {
      const accountByAddress = new Map([[counterpartyAccount.freshAddress, counterpartyAccount]]);
      const operation = buildOperation({
        type: "IN",
        value: new BigNumber(1),
        senders: [counterpartyAccount.freshAddress],
      });

      const { getByText, queryByText } = renderItem(operation, accountByAddress);

      expect(getByText(`From ${counterpartyName}`)).toBeVisible();
      expect(queryByText(new RegExp(counterpartyAccount.freshAddress.slice(0, 6)))).toBeNull();
    });

    it("should show internal account name instead of address for an outgoing transfer", () => {
      const accountByAddress = new Map([[counterpartyAccount.freshAddress, counterpartyAccount]]);
      const operation = buildOperation({
        type: "OUT",
        value: new BigNumber(1),
        recipients: [counterpartyAccount.freshAddress],
      });

      const { getByText, queryByText } = renderItem(operation, accountByAddress);

      expect(getByText(`To ${counterpartyName}`)).toBeVisible();
      expect(queryByText(new RegExp(counterpartyAccount.freshAddress.slice(0, 6)))).toBeNull();
    });
  });

  it("should show counterparty address for an external incoming send/receive", () => {
    const { getByText } = renderItem(
      buildOperation({ type: "IN", value: new BigNumber(1), senders: ["12345678901234567890"] }),
    );
    expect(getByText("From 123456...7890")).toBeVisible();
  });

  it("should show counterparty address for an external outgoing send/receive", () => {
    const { getByText } = renderItem(
      buildOperation({ type: "OUT", value: new BigNumber(1), recipients: ["abcdefghijklmnopqrs"] }),
    );
    expect(getByText("To abcdef...pqrs")).toBeVisible();
  });

  it("should not render the amount column when the operation amount is zero", () => {
    const { queryByText } = renderItem(buildOperation({ type: "REGISTER" }));
    expect(queryByText(/^\+1(\.0+)?\s*BTC$/)).toBeNull();
  });

  it("should render the amount when the operation amount is not zero", () => {
    const { getByText } = renderItem(
      buildOperation({ type: "IN", value: new BigNumber(100000000) }),
    );
    expect(getByText(/^\+1(\.0+)?\s*BTC$/)).toBeVisible();
  });

  it("should navigate to operation details and track when the row is pressed", async () => {
    const operation = buildOperation({ type: "IN", value: new BigNumber(1), senders: ["s"] });
    const { getByText, user } = renderItem(operation);
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
    const { getByText, user } = renderItem(operation);
    await user.press(getByText("Received"));
    expect(track).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should pass parentId when parentAccount is provided", async () => {
    const parentAccount = { ...account, id: "parent-account-id" };
    const operation = buildOperation({ type: "IN", value: new BigNumber(1), senders: ["s"] });
    const { getByText, user } = render(
      <OperationsListItem
        operation={operation}
        account={account}
        parentAccount={parentAccount}
        accountByAddress={emptyMap}
      />,
    );
    await user.press(getByText("Received"));
    expect(mockNavigate).toHaveBeenCalledWith(
      ScreenName.OperationDetails,
      expect.objectContaining({ parentId: "parent-account-id" }),
    );
  });
});
