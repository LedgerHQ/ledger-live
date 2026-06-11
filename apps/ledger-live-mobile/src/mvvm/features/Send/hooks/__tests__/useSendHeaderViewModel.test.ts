import { useNavigation } from "@react-navigation/native";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { renderHook } from "@testing-library/react-native";
import { useMaybeAccountName } from "~/reducers/wallet";

import { useSendFlowActions, useSendFlowData } from "../../context/SendFlowContext";
import { useAvailableBalance } from "../useAvailableBalance";
import { useCurrentSendFlowStep } from "../useCurrentSendFlowStep";
import { useSendHeaderViewModel } from "../useSendHeaderViewModel";

jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(),
}));
jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({
    t: (key: string, params?: { currency?: string }) =>
      key === "send.newSendFlow.title" ? `Send ${params?.currency}` : key,
  }),
}));
jest.mock("~/reducers/wallet");
jest.mock("../../context/SendFlowContext");
jest.mock("../useAvailableBalance");
jest.mock("../useCurrentSendFlowStep");

const mockedUseNavigation = jest.mocked(useNavigation);
const mockedUseMaybeAccountName = jest.mocked(useMaybeAccountName);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseSendFlowActions = jest.mocked(useSendFlowActions);
const mockedUseAvailableBalance = jest.mocked(useAvailableBalance);
const mockedUseCurrentSendFlowStep = jest.mocked(useCurrentSendFlowStep);

const mockAccount = {
  type: "Account",
  id: "base-account-1",
  currency: {
    ticker: "ETH",
  },
  balance: new BigNumber(7_000_000),
  spendableBalance: new BigNumber(5_969_83),
} as Account;

const mockRecipientSearch = {
  value: "",
  setValue: jest.fn(),
  clear: jest.fn(),
};

describe("useSendHeaderViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseNavigation.mockReturnValue({
      canGoBack: jest.fn(() => false),
      goBack: jest.fn(),
    } as never);
    mockedUseMaybeAccountName.mockReturnValue("Base 1");
    mockedUseAvailableBalance.mockReturnValue("$5,969.83");
    mockedUseCurrentSendFlowStep.mockReturnValue([
      SEND_FLOW_STEP.RECIPIENT,
      {
        id: SEND_FLOW_STEP.RECIPIENT,
        addressInput: true,
        canGoBack: false,
        showTitle: true,
        showHeaderRight: true,
      },
    ]);
    mockedUseSendFlowData.mockReturnValue({
      uiConfig: {
        recipientSupportsDomain: true,
      },
      recipientSearch: mockRecipientSearch,
      state: {
        account: {
          account: mockAccount,
          parentAccount: null,
          currency: mockAccount.currency,
        },
        transaction: {
          transaction: null,
          status: {},
          bridgeError: null,
          bridgePending: false,
        },
        recipient: null,
        operation: {
          optimisticOperation: null,
          transactionError: null,
          signed: false,
        },
        isLoading: false,
        flowStatus: "idle",
      },
    } as never);
    mockedUseSendFlowActions.mockReturnValue({
      close: jest.fn(),
      transaction: {
        updateTransaction: jest.fn(),
      },
      setRecipientSearchValue: jest.fn(),
      clearRecipientSearch: jest.fn(),
    } as never);
  });

  it("shows the account name and spendable balance below the send title", () => {
    const { result } = renderHook(() => useSendHeaderViewModel());

    expect(result.current.title).toBe("Send ETH");
    expect(result.current.descriptionText).toBe("Base 1 · $5,969.83");
  });
});
