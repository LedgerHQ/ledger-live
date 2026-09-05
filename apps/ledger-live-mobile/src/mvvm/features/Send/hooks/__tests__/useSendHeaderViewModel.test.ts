import { useNavigation } from "@react-navigation/native";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { useMaybeAccountName } from "~/reducers/wallet";

import { useSendFlowActions, useSendFlowData } from "../../context/SendFlowContext";
import { useSendAmountDisplayMode } from "@ledgerhq/live-common/flows/send/amount/SendAmountDisplayModeContext";
import { useAvailableBalance } from "../useAvailableBalance";
import { useCurrentSendFlowStep } from "../useCurrentSendFlowStep";
import { useSendHeaderViewModel } from "../useSendHeaderViewModel";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: jest.fn(),
}));
jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({
    t: (key: string, params?: { currency?: string }) =>
      key === "send.newSendFlow.title" ? `Send ${params?.currency}` : key,
  }),
}));
jest.mock("~/reducers/wallet", () => {
  const actual = jest.requireActual<typeof import("~/reducers/wallet")>("~/reducers/wallet");
  return {
    __esModule: true,
    ...actual,
    useMaybeAccountName: jest.fn(),
  };
});
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
    type: "CryptoCurrency",
    id: "ethereum",
    family: "evm",
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
  const mockGetState = jest.fn((): { routes: { name: string }[]; index: number } => ({
    routes: [{ name: ScreenName.SendFlowAmount }],
    index: 0,
  }));
  const mockAddListener = jest.fn(() => jest.fn());
  const mockClearRecipientSearch = jest.fn();
  const mockSetRecipientSearchValue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseNavigation.mockReturnValue({
      canGoBack: mockCanGoBack,
      goBack: mockGoBack,
      getState: mockGetState,
      navigate: mockNavigate,
      addListener: mockAddListener,
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
        onScannedURI: expect.any(Function),
      }),
    );

    const { onScannedURI } = mockNavigate.mock.calls[0][1] as {
      onScannedURI: (result: { address: string }) => void;
    };
    onScannedURI({ address: "0xscanned" });

    expect(mockSetRecipientSearchValue).toHaveBeenCalledWith("0xscanned");
  });

  it("prefills the transaction amount from a scanned EIP681 URI while staying on recipient", () => {
    const amount = new BigNumber("1000000000000000000");
    const mockUpdateTransaction = jest.fn();
    const currentTransaction = {
      family: "evm",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
    };

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
          transaction: currentTransaction,
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
        updateTransaction: mockUpdateTransaction,
      },
      setRecipientSearchValue: mockSetRecipientSearchValue,
      clearRecipientSearch: mockClearRecipientSearch,
    } as never);

    const { result } = renderHook(() => useSendHeaderViewModel());

    result.current.handleQrCodeClick();

    const { onScannedURI } = mockNavigate.mock.calls[0][1] as {
      onScannedURI: (result: { address: string; amount?: BigNumber }) => void;
    };
    onScannedURI({ address: "0xscanned", amount });

    expect(mockSetRecipientSearchValue).toHaveBeenCalledWith("0xscanned");
    expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
    const updater = mockUpdateTransaction.mock.calls[0][0];
    expect(updater(currentTransaction)).toEqual(
      expect.objectContaining({
        amount,
        useAllAmount: false,
      }),
    );
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  describe("recipient input placeholder", () => {
    const mockRecipientStep = ({ supportsDomain }: { supportsDomain: boolean }) => {
      mockedUseSendFlowData.mockReturnValue({
        uiConfig: { recipientSupportsDomain: supportsDomain },
        recipientSearch: mockRecipientSearch,
        state: {
          account: {
            account: mockAccount,
            parentAccount: null,
            currency: { ...mockAccount.currency, id: "ethereum" },
          },
          transaction: { transaction: null, status: {} },
          recipient: null,
        },
      } as never);
    };

    const withContactsFlag = (enabled: boolean, eligibleAddressFamilies: string[] = ["evm"]) =>
      withFlagOverrides({
        lwmContacts: {
          enabled,
          params: { newBadge: false, eligibleAddressFamilies },
        },
      });

    it("mentions contacts and ENS when the network supports both", () => {
      mockRecipientStep({ supportsDomain: true });

      const { result } = renderHook(() => useSendHeaderViewModel(), {
        overrideInitialState: withContactsFlag(true),
      });

      expect(result.current.recipientPlaceholder).toBe("send.newSendFlow.placeholderWithContacts");
    });

    it("mentions contacts only when the network has no ENS support", () => {
      mockRecipientStep({ supportsDomain: false });

      const { result } = renderHook(() => useSendHeaderViewModel(), {
        overrideInitialState: withContactsFlag(true),
      });

      expect(result.current.recipientPlaceholder).toBe(
        "send.newSendFlow.placeholderNoEnsWithContacts",
      );
    });

    it("keeps the default placeholder when the currency family is not eligible", () => {
      mockRecipientStep({ supportsDomain: true });

      const { result } = renderHook(() => useSendHeaderViewModel(), {
        overrideInitialState: withContactsFlag(true, ["bitcoin"]),
      });

      expect(result.current.recipientPlaceholder).toBe("send.newSendFlow.placeholder");
    });

    it("keeps the default placeholder when the contacts feature is disabled", () => {
      mockRecipientStep({ supportsDomain: false });

      const { result } = renderHook(() => useSendHeaderViewModel(), {
        overrideInitialState: withContactsFlag(false),
      });

      expect(result.current.recipientPlaceholder).toBe("send.newSendFlow.placeholderNoENS");
    });
  });
});
