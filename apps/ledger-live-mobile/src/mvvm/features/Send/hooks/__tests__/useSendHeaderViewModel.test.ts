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
import { useSelector } from "~/context/hooks";
import { useContactsFeature } from "@features/platform-contacts";
import { mockContact } from "@domain/entity-contact/schema.mock";
import { useRecipientContactSelection } from "../../context/RecipientContactSelectionContext";

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
jest.mock("../../context/RecipientContactSelectionContext");
jest.mock("@ledgerhq/live-common/flows/send/amount/SendAmountDisplayModeContext");
jest.mock("../useAvailableBalance");
jest.mock("../useCurrentSendFlowStep");
jest.mock("~/context/hooks");
jest.mock("@features/platform-contacts", () => ({
  useContactsFeature: jest.fn(() => ({ isEnabled: false, eligibleAddressFamilies: ["evm"] })),
}));
const mockedUseNavigation = jest.mocked(useNavigation);
const mockedUseMaybeAccountName = jest.mocked(useMaybeAccountName);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseSendFlowActions = jest.mocked(useSendFlowActions);
const mockedUseSendAmountDisplayMode = jest.mocked(useSendAmountDisplayMode);
const mockedUseAvailableBalance = jest.mocked(useAvailableBalance);
const mockedUseCurrentSendFlowStep = jest.mocked(useCurrentSendFlowStep);
const mockedUseRecipientContactSelection = jest.mocked(useRecipientContactSelection);

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
  const mockGetState = jest.fn(() => ({ routes: [{ name: ScreenName.SendFlowAmount }], index: 0 }));
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
    mockedUseRecipientContactSelection.mockReturnValue({
      selectedContact: undefined,
      selectContact: jest.fn(),
      clearSelectedContact: jest.fn(),
    });
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

  it("shows address selection for a contact and returns to the recipient list", () => {
    const clearSelectedContact = jest.fn();
    mockedUseRecipientContactSelection.mockReturnValue({
      selectedContact: mockContact({ name: "Benoit" }),
      selectContact: jest.fn(),
      clearSelectedContact,
    });

    const { result } = renderHook(() => useSendHeaderViewModel());

    expect(result.current.title).toBe("send.newSendFlow.selectAddress");
    expect(result.current.descriptionText).toBe("Benoit");
    expect(result.current.showRecipientInput).toBe(false);
    expect(result.current.showHeaderRight).toBe(false);
    expect(result.current.canGoBack).toBe(true);
    expect(mockAddListener).toHaveBeenCalledWith("beforeRemove", expect.any(Function));

    result.current.handleBackPress();

    expect(clearSelectedContact).toHaveBeenCalledTimes(1);
    expect(mockGoBack).not.toHaveBeenCalled();
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
    const mockRecipientStep = ({
      supportsDomain,
      isContactsFeatureEnabled,
      eligibleAddressFamilies = ["evm"],
    }: {
      supportsDomain: boolean;
      isContactsFeatureEnabled: boolean;
      eligibleAddressFamilies?: string[];
    }) => {
      jest
        .mocked(useContactsFeature)
        .mockReturnValue({ isEnabled: isContactsFeatureEnabled, eligibleAddressFamilies } as never);
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

    it("mentions contacts and ENS when the network supports both", () => {
      mockRecipientStep({
        supportsDomain: true,
        isContactsFeatureEnabled: true,
      });

      const { result } = renderHook(() => useSendHeaderViewModel());

      expect(result.current.recipientPlaceholder).toBe("send.newSendFlow.placeholderWithContacts");
    });

    it("mentions contacts only when the network has no ENS support", () => {
      mockRecipientStep({
        supportsDomain: false,
        isContactsFeatureEnabled: true,
      });

      const { result } = renderHook(() => useSendHeaderViewModel());

      expect(result.current.recipientPlaceholder).toBe(
        "send.newSendFlow.placeholderNoEnsWithContacts",
      );
    });

    it("keeps the default placeholder when the currency family is not eligible", () => {
      mockRecipientStep({
        supportsDomain: true,
        isContactsFeatureEnabled: true,
        eligibleAddressFamilies: ["bitcoin"],
      });

      const { result } = renderHook(() => useSendHeaderViewModel());

      expect(result.current.recipientPlaceholder).toBe("send.newSendFlow.placeholder");
    });

    it("keeps the default placeholder when the contacts feature is disabled", () => {
      mockRecipientStep({
        supportsDomain: false,
        isContactsFeatureEnabled: false,
      });

      const { result } = renderHook(() => useSendHeaderViewModel());

      expect(result.current.recipientPlaceholder).toBe("send.newSendFlow.placeholderNoENS");
    });
  });

  describe("recipient display on the amount step", () => {
    const ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
    const CONTACT = {
      id: "contact-benoit",
      isMe: false,
      name: "Benoit Jean",
      addresses: [{ id: "address-1", currencyId: "ethereum", label: "Eth main", address: ADDRESS }],
    };

    const mockAmountStep = () => {
      mockedUseCurrentSendFlowStep.mockReturnValue([
        SEND_FLOW_STEP.AMOUNT,
        {
          id: SEND_FLOW_STEP.AMOUNT,
          addressInput: true,
          canGoBack: true,
          showTitle: true,
          showHeaderRight: true,
        },
      ]);
      mockedUseSendFlowData.mockReturnValue({
        uiConfig: { recipientSupportsDomain: true },
        recipientSearch: mockRecipientSearch,
        state: {
          account: {
            account: mockAccount,
            parentAccount: null,
            currency: { ...mockAccount.currency, id: "ethereum" },
          },
          transaction: { transaction: { recipient: ADDRESS }, status: {} },
          recipient: { address: ADDRESS },
        },
      } as never);
    };

    it("shows the contact name when the recipient is a contact", () => {
      jest
        .mocked(useContactsFeature)
        .mockReturnValue({ isEnabled: true, eligibleAddressFamilies: ["evm"] } as never);
      jest.mocked(useSelector).mockReturnValue([CONTACT] as never);
      mockAmountStep();

      const { result } = renderHook(() => useSendHeaderViewModel());

      expect(result.current.recipientContact).toEqual({
        id: "contact-benoit",
        name: "Benoit Jean",
      });
      expect(result.current.formattedAddress).toBe("Benoit Jean");
    });

    it("shows the formatted address when the recipient is not a contact", () => {
      jest
        .mocked(useContactsFeature)
        .mockReturnValue({ isEnabled: true, eligibleAddressFamilies: ["evm"] } as never);
      jest.mocked(useSelector).mockReturnValue([] as never);
      mockAmountStep();

      const { result } = renderHook(() => useSendHeaderViewModel());

      expect(result.current.recipientContact).toBeUndefined();
      expect(result.current.formattedAddress).toBe("0x123456...12345678");
    });

    it("shows the formatted address when the contacts feature is disabled", () => {
      jest
        .mocked(useContactsFeature)
        .mockReturnValue({ isEnabled: false, eligibleAddressFamilies: ["evm"] } as never);
      jest.mocked(useSelector).mockReturnValue([CONTACT] as never);
      mockAmountStep();

      const { result } = renderHook(() => useSendHeaderViewModel());

      expect(result.current.recipientContact).toBeUndefined();
      expect(result.current.formattedAddress).toBe("0x123456...12345678");
    });

    it("opens Recipient when Amount is the first screen in the flow", () => {
      mockAmountStep();
      mockCanGoBack.mockReturnValue(false);

      const { result } = renderHook(() => useSendHeaderViewModel());

      result.current.handleRecipientInputPress();

      expect(mockSetRecipientSearchValue).toHaveBeenCalledWith(ADDRESS);
      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.SendFlowRecipient);
      expect(mockGoBack).not.toHaveBeenCalled();
    });

    it("opens Recipient when going back would leave Send for Pay", () => {
      mockAmountStep();
      mockCanGoBack.mockReturnValue(true);
      mockGetState.mockReturnValue({
        routes: [{ name: "Pay" }, { name: ScreenName.SendFlowAmount }],
        index: 1,
      });

      const { result } = renderHook(() => useSendHeaderViewModel());

      result.current.handleRecipientInputPress();

      expect(mockNavigate).toHaveBeenCalledWith(ScreenName.SendFlowRecipient);
      expect(mockGoBack).not.toHaveBeenCalled();
    });

    it("goes back to Recipient when that step is already under Amount", () => {
      mockAmountStep();
      mockCanGoBack.mockReturnValue(true);
      mockGetState.mockReturnValue({
        routes: [{ name: ScreenName.SendFlowRecipient }, { name: ScreenName.SendFlowAmount }],
        index: 1,
      });

      const { result } = renderHook(() => useSendHeaderViewModel());

      result.current.handleRecipientInputPress();

      expect(mockGoBack).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("filters Recipient search by the contact name", () => {
      jest
        .mocked(useContactsFeature)
        .mockReturnValue({ isEnabled: true, eligibleAddressFamilies: ["evm"] } as never);
      jest.mocked(useSelector).mockReturnValue([CONTACT] as never);
      mockAmountStep();

      const { result } = renderHook(() => useSendHeaderViewModel());

      result.current.handleRecipientInputPress();

      expect(mockSetRecipientSearchValue).toHaveBeenCalledWith("Benoit Jean");
    });
  });
});
