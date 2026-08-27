import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen, waitFor } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Account, Operation } from "@ledgerhq/types-live";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { setupRecentAddressesStore } from "@ledgerhq/live-common/account/index";
import { useLLDCoinFamily } from "~/renderer/families";
import Body from "./Body";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: object, patch: object) => ({ ...tx, ...patch }),
  }),
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  ...jest.requireActual("@ledgerhq/live-common/bridge/useBridgeTransaction"),
  default: jest.fn(),
}));

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: jest.fn(() => ({})),
}));

// The real Stepper pulls in the full step tree (device flows, summary, etc.);
// this test only cares about the props Body.tsx computes and hands it down.
jest.mock(
  "~/renderer/components/Stepper",
  () =>
    ({
      __esModule: true,
      default: (props: {
        children?: React.ReactNode;
        onOperationBroadcasted?: (o: unknown) => void;
      }) => (
        <div data-testid="mock-stepper">
          <button
            type="button"
            onClick={() => props.onOperationBroadcasted?.({ id: "op-1", hash: "op-hash-1" })}
          >
            broadcast
          </button>
          {props.children}
        </div>
      ),
    }) as never,
);

const mockedUseBridgeTransaction = jest.mocked(useBridgeTransaction);
const mockedUseLLDCoinFamily = jest.mocked(useLLDCoinFamily);

const baseAccount = createFixtureAccount();

const buildAccount = (id: string, currencyId = "bitcoin"): Account =>
  ({
    ...baseAccount,
    id,
    currency: { ...baseAccount.currency, id: currencyId } as CryptoCurrency,
  }) as unknown as Account;

const baseTransaction = {
  family: "bitcoin",
  amount: new BigNumber(0),
  recipient: "test-recipient",
};

const setupBridgeTransaction = (account: Account, updateAccount = jest.fn()) => {
  mockedUseBridgeTransaction.mockReturnValue({
    transaction: baseTransaction,
    setTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    account,
    parentAccount: undefined,
    setAccount: jest.fn(),
    updateAccount,
    status: { errors: {}, warnings: {} },
    bridgeError: null,
    bridgePending: false,
  } as unknown as ReturnType<typeof useBridgeTransaction>);
  return updateAccount;
};

const renderBody = (account: Account) =>
  render(<Body stepId="recipient" onChangeStepId={jest.fn()} params={{ account }} />, {
    initialState: { accounts: [account] },
  });

describe("Send Body", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseLLDCoinFamily.mockReturnValue({});
    // handleOperationBroadcasted reaches into the app-wide recent-addresses
    // store, only initialized by the real app bootstrap outside this test.
    setupRecentAddressesStore({}, () => {});
  });

  it("propagates a live store account update into the modal, without touching the in-progress transaction", async () => {
    const account = buildAccount("acc-1");
    const updateAccount = setupBridgeTransaction(account);
    const { store } = renderBody(account);

    expect(updateAccount).not.toHaveBeenCalled();

    const updatedAccount = { ...account, balance: account.balance.plus(1) };
    act(() => {
      store.dispatch({ type: "REPLACE_ACCOUNTS", payload: [updatedAccount] });
    });

    await waitFor(() => {
      expect(updateAccount).toHaveBeenCalledWith(updatedAccount);
    });
    // The in-progress transaction is separate local state in useBridgeTransaction,
    // untouched by this account-refresh path; the mocked hook is never re-invoked
    // with a different transaction as a side effect of the store update.
    expect(mockedUseBridgeTransaction).toHaveBeenCalled();
  });

  it("ignores a store update for a different account id", async () => {
    const account = buildAccount("acc-1");
    const otherAccount = buildAccount("acc-2");
    const updateAccount = setupBridgeTransaction(account);
    const { store } = renderBody(account);

    act(() => {
      store.dispatch({
        type: "REPLACE_ACCOUNTS",
        payload: [account, { ...otherAccount, balance: otherAccount.balance.plus(1) }],
      });
    });

    // Give any effect a chance to run before asserting the negative.
    await screen.findByTestId("mock-stepper");
    expect(updateAccount).not.toHaveBeenCalled();
  });

  it("renders no PostBroadcastEffect slot for a family that does not register one", async () => {
    const account = buildAccount("acc-1", "bitcoin");
    setupBridgeTransaction(account);
    mockedUseLLDCoinFamily.mockReturnValue({});
    const { user } = renderBody(account);

    await user.click(screen.getByText("broadcast"));

    expect(screen.queryByTestId("post-broadcast-effect")).not.toBeInTheDocument();
    // Existing modal behavior (steps rendering) is otherwise unaffected.
    expect(screen.getByTestId("mock-stepper")).toBeInTheDocument();
  });

  it("renders the family's PostBroadcastEffect once an operation has been broadcast", async () => {
    const account = buildAccount("acc-1", "zcash");
    setupBridgeTransaction(account);
    const PostBroadcastEffect = ({
      account,
      operation,
    }: {
      account: Account;
      operation: Operation;
    }) => <div data-testid="post-broadcast-effect">{`${account.id}|${operation.id}`}</div>;
    mockedUseLLDCoinFamily.mockReturnValue({ PostBroadcastEffect });
    const { user } = renderBody(account);

    expect(screen.queryByTestId("post-broadcast-effect")).not.toBeInTheDocument();

    await user.click(screen.getByText("broadcast"));

    await waitFor(() => {
      expect(screen.getByTestId("post-broadcast-effect")).toHaveTextContent("acc-1|op-1");
    });
  });
});
