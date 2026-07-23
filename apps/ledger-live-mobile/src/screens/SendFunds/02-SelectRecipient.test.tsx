import React from "react";
import { screen, render } from "@tests/test-renderer";
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
jest.mock("@react-native-clipboard/clipboard", () => ({}));
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

describe("SendSelectRecipient — custom send flow", () => {
  const mockNavigateAfterRecipient = jest.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    mockNavigateAfterRecipient.mockClear();
    mockGetCustomSendFlow.mockReturnValue(null);
  });

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

  it("calls navigateAfterRecipient and returns early when it returns true", async () => {
    mockNavigateAfterRecipient.mockReturnValue(true);
    mockGetCustomSendFlow.mockReturnValue({
      screens: [],
      navigateAfterRecipient: mockNavigateAfterRecipient,
    });

    jest.spyOn(useBridgeTransactionModule, "default").mockReturnValue({
      transaction: { recipient: "aleo1abc", family: "aleo" },
      status: { errors: {}, warnings: {} },
    } as unknown as useBridgeTransactionModule.Result);

    const { user } = render(
      <SendSelectRecipient
        route={
          {
            params: { accountId: "parentId" },
          } as unknown as RouteProp<
            SendFundsNavigatorStackParamList,
            ScreenName.SendSelectRecipient
          >
        }
      />,
      { overrideInitialState: accountState },
    );

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

    jest.spyOn(useBridgeTransactionModule, "default").mockReturnValue({
      transaction: { recipient: "aleo1abc", family: "aleo" },
      status: { errors: {}, warnings: {} },
    } as unknown as useBridgeTransactionModule.Result);

    const { user } = render(
      <SendSelectRecipient
        route={
          {
            params: { accountId: "parentId" },
          } as unknown as RouteProp<
            SendFundsNavigatorStackParamList,
            ScreenName.SendSelectRecipient
          >
        }
      />,
      { overrideInitialState: accountState },
    );

    await user.press(screen.getByTestId("enabled-recipient-continue-button"));

    expect(mockNavigateAfterRecipient).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.SendAmountCoin, expect.anything());
  });
});
