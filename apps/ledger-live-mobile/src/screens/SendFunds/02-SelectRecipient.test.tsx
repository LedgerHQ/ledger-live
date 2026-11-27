import React from "react";
import { screen, render, fireEvent, waitFor, withFlagOverrides } from "@tests/test-renderer";
import SendSelectRecipient from "./02-SelectRecipient";
import { Account } from "@ledgerhq/types-live";
import * as useBridgeTransactionModule from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { RouteProp } from "@react-navigation/core";
import { ScreenName } from "~/const";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { getCustomSendFlow } from "~/screens/SendFunds/utils/customSendFlow";

const mockNavigate = jest.fn();

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  ...jest.requireActual("@ledgerhq/live-common/bridge/useBridgeTransaction"),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn().mockReturnValue({}),
}));
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useScrollToTop: jest.fn(),
  useNavigation: () => ({ navigate: mockNavigate, getParent: jest.fn(() => null) }),
}));
jest.mock("~/screens/SendFunds/utils/customSendFlow", () => ({
  getCustomSendFlow: jest.fn(() => null),
}));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn().mockReturnValue({
    updateTransaction: jest.fn(),
    getStuckAccountAndOperation: jest.fn(() => undefined),
  }),
}));

describe("SendSelectRecipient", () => {
  it.each([
    ["transfer fee", "transferFee"],
    ["transfer hook", "transferHook"],
  ])("displays a warning when the token embeds the %s extension", (_s, extension) => {
    jest.spyOn(useBridgeTransactionModule, "default").mockReturnValue({
      transaction: { recipient: "" },
      status: { errors: {}, warnings: {} },
    } as unknown as useBridgeTransactionModule.Result);

    render(
      <SendSelectRecipient
        route={
          {
            params: {
              accountId: "accountId",
              parentId: "parentId",
            },
          } as unknown as RouteProp<
            SendFundsNavigatorStackParamList,
            ScreenName.SendSelectRecipient
          >
        }
      />,
      {
        overrideInitialState: state => ({
          ...state,
          accounts: {
            active: [
              {
                id: "parentId",
                type: "Account",
                currency: { units: [] },
                subAccounts: [
                  {
                    id: "accountId",
                    type: "TokenAccount",
                    token: {},
                    extensions: {
                      [extension]: {},
                    },
                  },
                ],
              } as unknown as Account,
            ],
          },
        }),
      },
    );

    expect(screen.queryByTestId("spl-2022-problematic-extension")).toHaveTextContent(
      "You are interacting with a token that is part of the Token-2022 program, also known as Token Extensions. This token comes with specific risks. Click here to learn more.",
    );
  });

  it("does not display any warning with no problematic token extensions", () => {
    render(
      <SendSelectRecipient
        route={
          {
            params: {
              accountId: "accountId",
              parentId: "parentId",
            },
          } as unknown as RouteProp<
            SendFundsNavigatorStackParamList,
            ScreenName.SendSelectRecipient
          >
        }
      />,
      {
        overrideInitialState: state => ({
          ...state,
          accounts: {
            active: [
              {
                id: "parentId",
                type: "Account",
                currency: { units: [] },
                subAccounts: [
                  {
                    id: "accountId",
                    type: "TokenAccount",
                    token: {},
                    extensions: {},
                  },
                ],
              } as unknown as Account,
            ],
          },
        }),
      },
    );

    expect(screen.queryByTestId("spl-2022-problematic-extension")).toBeNull();
  });
});

const mockGetCustomSendFlow = jest.mocked(getCustomSendFlow);

const accountState = (state: Parameters<typeof Object>[0]) => ({
  ...state,
  accounts: {
    active: [
      {
        id: "parentId",
        type: "Account",
        currency: { units: [], family: "aleo", id: "aleo" },
        subAccounts: [],
        operations: [],
        operationsCount: 0,
        balance: { gt: () => true },
        spendableBalance: { gt: () => true },
      } as unknown as Account,
    ],
  },
});

const mockBridgeTransaction = (overrides: Record<string, unknown> = {}) =>
  jest.spyOn(useBridgeTransactionModule, "default").mockReturnValue({
    transaction: { recipient: "aleo1abc", family: "aleo" },
    status: { errors: {}, warnings: {} },
    ...overrides,
  } as unknown as useBridgeTransactionModule.Result);

const renderRecipient = (params: Record<string, unknown> = {}) =>
  render(
    <SendSelectRecipient
      route={
        { params: { accountId: "parentId", ...params } } as unknown as RouteProp<
          SendFundsNavigatorStackParamList,
          ScreenName.SendSelectRecipient
        >
      }
    />,
    { overrideInitialState: accountState },
  );

describe("SendSelectRecipient — custom send flow", () => {
  const mockNavigateAfterRecipient = jest.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    mockNavigateAfterRecipient.mockClear();
    mockGetCustomSendFlow.mockReturnValue(null);
  });

  it("calls navigateAfterRecipient and returns early when it returns true", async () => {
    mockNavigateAfterRecipient.mockReturnValue(true);
    mockGetCustomSendFlow.mockReturnValue({
      screens: [],
      navigateAfterRecipient: mockNavigateAfterRecipient,
    });

    mockBridgeTransaction();

    const { user } = renderRecipient();

    await user.press(screen.getByTestId("enabled-recipient-continue-button"));

    expect(mockNavigateAfterRecipient).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalledWith(ScreenName.SendAmountCoin, expect.anything());
  });

  it("falls through to SendAmountCoin when navigateAfterRecipient returns false", async () => {
    mockNavigateAfterRecipient.mockReturnValue(false);
    mockGetCustomSendFlow.mockReturnValue({
      screens: [],
      navigateAfterRecipient: mockNavigateAfterRecipient,
    });

    mockBridgeTransaction();

    const { user } = renderRecipient();

    await user.press(screen.getByTestId("enabled-recipient-continue-button"));

    expect(mockNavigateAfterRecipient).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.SendAmountCoin, expect.anything());
  });
});

describe("SendSelectRecipient — transaction mirrored from a later step", () => {
  it("adopts the transaction pushed onto its route params", () => {
    const setTransaction = jest.fn();
    const editedTransaction = { recipient: "aleo1abc", family: "aleo", memo: "123" };

    mockBridgeTransaction({ setTransaction });

    renderRecipient({ transaction: editedTransaction });

    expect(setTransaction).toHaveBeenCalledTimes(1);
    expect(setTransaction).toHaveBeenCalledWith(editedTransaction);
  });
});

describe("SendSelectRecipient — memo longer than the chain allows", () => {
  const cardanoAccountState = withFlagOverrides({ llmMemoTag: { enabled: true } }, state => ({
    ...state,
    accounts: {
      active: [
        {
          id: "parentId",
          type: "Account",
          currency: { units: [], family: "cardano", id: "cardano" },
          subAccounts: [],
          operations: [],
          operationsCount: 0,
          balance: { gt: () => true },
          spendableBalance: { gt: () => true },
        } as unknown as Account,
      ],
    },
  }));

  it("keeps Continue disabled once the debounced memo update lands, until the memo fits", async () => {
    const setTransaction = jest.fn();
    mockBridgeTransaction({
      transaction: { recipient: "addr1-recipient", family: "cardano" },
      setTransaction,
    });
    render(
      <SendSelectRecipient
        route={
          { params: { accountId: "parentId" } } as unknown as RouteProp<
            SendFundsNavigatorStackParamList,
            ScreenName.SendSelectRecipient
          >
        }
      />,
      { overrideInitialState: cardanoAccountState },
    );

    setTransaction.mockClear();
    fireEvent.changeText(screen.getByTestId("memo-tag-input"), "a".repeat(65));
    await waitFor(() => expect(setTransaction).toHaveBeenCalled());

    expect(screen.getByTestId("memo-tag-input")).toHaveDisplayValue("a".repeat(65));
    expect(screen.getByText("Memo is too long (65/64 bytes)")).toBeVisible();
    expect(screen.getByTestId("disabled-recipient-continue-button")).toBeVisible();

    setTransaction.mockClear();
    fireEvent.changeText(screen.getByTestId("memo-tag-input"), "a".repeat(64));
    await waitFor(() => expect(setTransaction).toHaveBeenCalled());

    expect(screen.getByTestId("enabled-recipient-continue-button")).toBeVisible();
  });
});

describe("SendSelectRecipient — Stellar memo in the wrong format", () => {
  const stellarAccountState = withFlagOverrides({ llmMemoTag: { enabled: true } }, state => ({
    ...state,
    accounts: {
      active: [
        {
          id: "parentId",
          type: "Account",
          currency: { units: [], family: "stellar", id: "stellar" },
          subAccounts: [],
          operations: [],
          operationsCount: 0,
          balance: { gt: () => true },
          spendableBalance: { gt: () => true },
        } as unknown as Account,
      ],
    },
  }));

  it("shows why Continue is disabled for a text memo over 28 characters", async () => {
    const setTransaction = jest.fn();
    mockBridgeTransaction({
      transaction: { recipient: "GRECIPIENT", family: "stellar" },
      setTransaction,
    });
    render(
      <SendSelectRecipient
        route={
          { params: { accountId: "parentId" } } as unknown as RouteProp<
            SendFundsNavigatorStackParamList,
            ScreenName.SendSelectRecipient
          >
        }
      />,
      { overrideInitialState: stellarAccountState },
    );

    setTransaction.mockClear();
    fireEvent.changeText(screen.getByPlaceholderText("Memo value"), "a".repeat(29));
    await waitFor(() => expect(setTransaction).toHaveBeenCalled());

    expect(screen.getByText("Memo format is wrong")).toBeVisible();
    expect(screen.getByTestId("disabled-recipient-continue-button")).toBeVisible();
  });
});
