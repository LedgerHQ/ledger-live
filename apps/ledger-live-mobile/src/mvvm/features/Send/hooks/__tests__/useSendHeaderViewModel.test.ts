import { useNavigation } from "@react-navigation/native";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { renderHook } from "@testing-library/react-native";
import { ScreenName } from "~/const";
import { useMaybeAccountName } from "~/reducers/wallet";

import { useSendFlowActions, useSendFlowData } from "../../context/SendFlowContext";
import { useSendAmountDisplayMode } from "@ledgerhq/live-common/flows/send/amount/SendAmountDisplayModeContext";
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
jest.mock("@ledgerhq/live-common/flows/send/amount/SendAmountDisplayModeContext");
jest.mock("../useAvailableBalance");
jest.mock("../useCurrentSendFlowStep");

const mockedUseNavigation = jest.mocked(useNavigation);
const mockedUseMaybeAccountName = jest.mocked(useMaybeAccountName);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseSendFlowActions = jest.mocked(useSendFlowActions);
const mockedUseSendAmountDisplayMode = jest.mocked(useSendAmountDisplayMode);
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
  const mockNavigate = jest.fn();
  const mockGoBack = jest.fn();
  const mockCanGoBack = jest.fn(() => false);
  const mockClearRecipientSearch = jest.fn();
  const mockSetRecipientSearchValue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseNavigation.mockReturnValue({
      canGoBack: mockCanGoBack,
      goBack: mockGoBack,
      navigate: mockNavigate,
    } as never);
    mockedUseMaybeAccountName.mockReturnValue("Base 1");
    mockedUseSendAmountDisplayMode.mockReturnValue({
      displayMode: "fiat",
      setDisplayMode: jest.fn(),
    });
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
      setRecipientSearchValue: mockSetRecipientSearchValue,
      clearRecipientSearch: mockClearRecipientSearch,
    } as never);
  });

  it("shows the account name and spendable balance below the send title", () => {
    const { result } = renderHook(() => useSendHeaderViewModel());

    expect(result.current.title).toBe("Send ETH");
    expect(result.current.descriptionText).toBe("Base 1 · $5,969.83");
    expect(mockedUseAvailableBalance).toHaveBeenCalledWith(mockAccount, "fiat");
  });

  it("formats the header balance with the selected amount display mode", () => {
    mockedUseSendAmountDisplayMode.mockReturnValue({
      displayMode: "crypto",
      setDisplayMode: jest.fn(),
    });
    mockedUseAvailableBalance.mockReturnValue("0.0596983 ETH");

    const { result } = renderHook(() => useSendHeaderViewModel());

    expect(result.current.descriptionText).toBe("Base 1 · 0.0596983 ETH");
    expect(mockedUseAvailableBalance).toHaveBeenCalledWith(mockAccount, "crypto");
  });

  it("forces the header balance to crypto on the coin control step, ignoring the fiat display mode", () => {
    mockedUseSendAmountDisplayMode.mockReturnValue({
      displayMode: "fiat",
      setDisplayMode: jest.fn(),
    });
    mockedUseCurrentSendFlowStep.mockReturnValue([
      SEND_FLOW_STEP.COIN_CONTROL,
      {
        id: SEND_FLOW_STEP.COIN_CONTROL,
        canGoBack: true,
        showTitle: true,
        showHeaderRight: false,
      },
    ]);

    renderHook(() => useSendHeaderViewModel());

    expect(mockedUseAvailableBalance).toHaveBeenCalledWith(mockAccount, "crypto");
  });

  it("navigates to ScanRecipient and fills the search with the scanned address", () => {
    const { result } = renderHook(() => useSendHeaderViewModel());

    result.current.handleQrCodeClick();

    expect(mockClearRecipientSearch).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(
      ScreenName.ScanRecipient,
      expect.objectContaining({
        accountId: mockAccount.id,
        parentId: undefined,
        transaction: undefined,
        onScanned: expect.any(Function),
      }),
    );

    const { onScanned } = mockNavigate.mock.calls[0][1] as {
      onScanned: (address: string) => void;
    };
    onScanned("0xscanned");

    expect(mockSetRecipientSearchValue).toHaveBeenCalledWith("0xscanned");
  });
});
