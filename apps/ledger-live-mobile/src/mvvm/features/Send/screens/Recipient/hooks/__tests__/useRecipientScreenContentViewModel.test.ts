import { act, renderHook } from "@testing-library/react-native";
import { useAnalytics } from "~/analytics";
import { useMemoViewModel } from "../../../../components/Memo/hooks/useMemoViewModel";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { useRecipientScreenView } from "../useRecipientScreenView";
import { createMockAccount } from "./accounts";
import { useRecipientScreenContentViewModel } from "../useRecipientScreenContentViewModel";

jest.mock("~/analytics");
jest.mock("../../../../components/Memo/hooks/useMemoViewModel");
jest.mock("../../../../context/SendFlowContext");
jest.mock("../useRecipientScreenView");
jest.mock("@ledgerhq/ledger-wallet-framework/tracking/send", () => ({
  getSendFlowTrackingProperties: jest.fn(() => ({ currency: "bitcoin" })),
}));
jest.mock("~/logic/keyboardVisible", () => ({
  shouldUseKeyboardAvoidance: jest.fn(() => true),
}));

const mockedUseAnalytics = jest.mocked(useAnalytics);
const mockedUseMemoViewModel = jest.mocked(useMemoViewModel);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseRecipientScreenView = jest.mocked(useRecipientScreenView);

const account = createMockAccount({ id: "account_1" });
const track = jest.fn();
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
} as never;

const memoViewModel = {
  hasFilledMemo: true,
  memoError: undefined,
} as never;

describe("useRecipientScreenContentViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAnalytics.mockReturnValue({ track } as never);
    mockedUseSendFlowData.mockReturnValue({
      uiConfig: { hasMemo: true },
    } as never);
    mockedUseRecipientScreenView.mockReturnValue(recipientViewModel);
    mockedUseMemoViewModel.mockReturnValue(memoViewModel);
  });

  function renderViewModel() {
    return renderHook(() =>
      useRecipientScreenContentViewModel({
        account,
        currency: account.currency,
        onAddressSelected: jest.fn(),
        recipientSupportsDomain: true,
        onMemoProceed,
      }),
    );
  }

  it("builds the props-only view state and tracks memo visibility from effects", () => {
    const { result } = renderViewModel();

    expect(result.current.showMemo).toBe(true);
    expect(result.current.showMatched).toBe(true);
    expect(result.current.keyboardBehavior).toBe("padding");
    expect(track).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenNthCalledWith(
      1,
      "send_modal",
      expect.objectContaining({ name: "step memo" }),
    );
    expect(track).toHaveBeenNthCalledWith(
      2,
      "send_modal",
      expect.objectContaining({ name: "step memo", button: "skip" }),
    );
    expect(mockedUseMemoViewModel).toHaveBeenCalledWith({
      address: "resolved-address",
      onSkip: expect.any(Function),
    });
  });

  it("tracks and forwards matched-address selection", () => {
    const { result } = renderViewModel();

    act(() => {
      result.current.handleMatchedAddress("destination", "name.eth");
    });

    expect(track).toHaveBeenCalledWith(
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

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "skip", page: "step memo" }),
    );
    expect(onMemoProceed).toHaveBeenCalledTimes(1);
  });
});
