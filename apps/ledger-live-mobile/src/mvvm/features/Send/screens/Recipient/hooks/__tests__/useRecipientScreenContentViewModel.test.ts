import { act, renderHook } from "@testing-library/react-native";
import { track } from "~/analytics";
import { useMemoViewModel } from "../../../../components/Memo/hooks/useMemoViewModel";
import { useAddressMatchedSectionViewModel } from "../useAddressMatchedSectionViewModel";
import { useRecipientScreenView } from "../useRecipientScreenView";
import { createMockAccount } from "./accounts";
import { useRecipientScreenContentViewModel } from "../useRecipientScreenContentViewModel";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";

jest.mock("~/analytics");
jest.mock("../../../../components/Memo/hooks/useMemoViewModel");
jest.mock("../useRecipientScreenView");
jest.mock("../useAddressMatchedSectionViewModel");
jest.mock("@ledgerhq/ledger-wallet-framework/tracking/send", () => ({
  getSendFlowTrackingProperties: jest.fn(() => ({ currency: "bitcoin" })),
}));
jest.mock("~/logic/keyboardVisible", () => ({
  shouldUseKeyboardAvoidance: jest.fn(() => true),
}));
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: {
    hasMemoForRecipient: jest.fn(),
  },
}));

const mockedTrack = jest.mocked(track);
const mockedUseMemoViewModel = jest.mocked(useMemoViewModel);
const mockedUseRecipientScreenView = jest.mocked(useRecipientScreenView);
const mockedUseAddressMatchedSectionViewModel = jest.mocked(useAddressMatchedSectionViewModel);
const mockedSendFeatures = jest.mocked(sendFeatures);

const account = createMockAccount({ id: "account_1" });
const handleAddressSelect = jest.fn();
const onMemoProceed = jest.fn();

const recipientViewModel = {
  isLoading: false,
  showInitialState: false,
  showMatchedAddress: true,
  result: {
    status: "valid",
    error: null,
    resolvedAddress: "resolved-address",
    bridgeErrors: {},
    bridgeWarnings: {},
    hasBridgeValidationResult: true,
    matchedAccounts: [],
    matchedContact: undefined,
    isLedgerAccount: false,
    isFirstInteraction: false,
  },
  searchValue: "typed-address",
  showBridgeSenderError: false,
  bridgeSenderError: undefined,
  showSanctionedBanner: false,
  showBridgeRecipientError: false,
  showBridgeRecipientWarning: false,
  showAddressValidationError: false,
  bridgeRecipientError: undefined,
  bridgeRecipientWarning: undefined,
  handleAddressSelect,
  isAddressComplete: true,
  isAddressValid: true,
  addressValidationErrorType: null,
  clipboardAddress: null,
  handlePasteFromClipboard: jest.fn(),
  isContactsFeatureEnabled: true,
  hasAddressBook: false,
  addressBookFamilyName: "Bitcoin",
} as never;

const memoViewModel = {
  hasFilledMemo: true,
  memoError: undefined,
} as never;

const addressMatchedSectionViewModel = {
  isVisible: true,
  showHeader: false,
  addressMatchedLabel: "Address matched",
  suggestion: null,
  showFirstInteractionWarning: false,
};

describe("useRecipientScreenContentViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSendFeatures.hasMemoForRecipient.mockReturnValue(true);
    mockedUseRecipientScreenView.mockReturnValue(recipientViewModel);
    mockedUseMemoViewModel.mockReturnValue(memoViewModel);
    mockedUseAddressMatchedSectionViewModel.mockReturnValue(
      addressMatchedSectionViewModel as never,
    );
  });

  function renderViewModel() {
    return renderHook(() =>
      useRecipientScreenContentViewModel({
        account,
        currency: account.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
        onMemoProceed,
        onAddContact: jest.fn(),
      }),
    );
  }

  it("builds the props-only view state and tracks memo visibility from effects", () => {
    const { result } = renderViewModel();

    expect(result.current.showMemo).toBe(true);
    expect(result.current.showMatched).toBe(true);
    expect(result.current.keyboardBehavior).toBe("padding");
    expect(result.current.addressMatchedSectionViewModel).toEqual(addressMatchedSectionViewModel);
    expect(mockedTrack).toHaveBeenCalledTimes(2);
    expect(mockedTrack).toHaveBeenNthCalledWith(
      1,
      "send_modal",
      expect.objectContaining({ name: "step memo" }),
    );
    expect(mockedTrack).toHaveBeenNthCalledWith(
      2,
      "send_modal",
      expect.objectContaining({ name: "step memo", button: "skip" }),
    );
    expect(mockedUseMemoViewModel).toHaveBeenCalledWith({
      address: "resolved-address",
      hasMemo: true,
      onSkip: expect.any(Function),
    });
    expect(mockedUseAddressMatchedSectionViewModel).toHaveBeenCalledWith(
      expect.objectContaining({
        isContactsFeatureEnabled: true,
        hasAddressBook: false,
        addressBookFamilyName: "Bitcoin",
        onAddContact: expect.any(Function),
      }),
    );
  });

  it("hides memo controls when the recipient does not support memos", () => {
    mockedSendFeatures.hasMemoForRecipient.mockReturnValue(false);

    const { result } = renderViewModel();

    expect(mockedSendFeatures.hasMemoForRecipient).toHaveBeenCalledWith(
      account.currency,
      "resolved-address",
    );
    expect(result.current.showMemo).toBe(false);
    expect(mockedUseMemoViewModel).toHaveBeenCalledWith({
      address: "",
      hasMemo: false,
      onSkip: expect.any(Function),
    });
  });

  it("tracks and forwards matched-address selection", () => {
    renderViewModel();
    const { onSelect } = mockedUseAddressMatchedSectionViewModel.mock.calls[0][0];

    act(() => {
      onSelect("destination", "name.eth");
    });

    expect(mockedTrack).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "my accounts", page: "step recipient" }),
    );
    expect(handleAddressSelect).toHaveBeenCalledWith("destination", "name.eth");
  });

  it("tracks memo skipping before proceeding", () => {
    renderViewModel();
    const { onSkip } = mockedUseMemoViewModel.mock.calls[0][0];

    act(() => {
      onSkip();
    });

    expect(mockedTrack).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "skip", page: "step memo" }),
    );
    expect(onMemoProceed).toHaveBeenCalledTimes(1);
  });
});
