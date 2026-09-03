import { act, renderHook } from "@testing-library/react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useFlowWizard } from "../../../../../FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../../../../context/SendFlowContext";
import { useRecipientScanner } from "../../../../context/RecipientScannerContext";
import { trackPage } from "~/renderer/analytics/segment";
import { createMockAccount } from "../../__integrations__/__fixtures__/accounts";
import { useRecipientScreenViewModel } from "../useRecipientScreenViewModel";

jest.mock("@ledgerhq/live-common/account/index");
jest.mock("../../../../../FlowWizard/FlowWizardContext");
jest.mock("../../../../context/SendFlowContext");
jest.mock("../../../../context/RecipientScannerContext");
jest.mock("~/renderer/analytics/segment", () => ({
  trackPage: jest.fn(),
}));

const mockedGetAccountCurrency = jest.mocked(getAccountCurrency);
const mockedUseFlowWizard = jest.mocked(useFlowWizard);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseSendFlowActions = jest.mocked(useSendFlowActions);
const mockedUseRecipientScanner = jest.mocked(useRecipientScanner);
const mockedTrackPage = jest.mocked(trackPage);

const account = createMockAccount();
const setRecipient = jest.fn();
const close = jest.fn();
const goToNextStep = jest.fn();

describe("useRecipientScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAccountCurrency.mockReturnValue(account.currency);
    mockedUseSendFlowData.mockReturnValue({
      state: {
        account: { account, parentAccount: null, currency: account.currency },
        recipient: { address: "previous-address", memo: { type: "MEMO", value: "123" } },
      } as never,
      uiConfig: { recipientSupportsDomain: true } as never,
      recipientSearch: { value: "", setValue: jest.fn(), clear: jest.fn() },
      isRecipientAddressComplete: false,
    });
    mockedUseSendFlowActions.mockReturnValue({
      transaction: { setRecipient } as never,
      close,
    } as never);
    mockedUseFlowWizard.mockReturnValue({
      navigation: { goToNextStep },
    } as never);
    mockedUseRecipientScanner.mockReturnValue({
      isScannerOpen: false,
      closeScanner: jest.fn(),
      toggleScanner: jest.fn(),
    });
  });

  it("tracks the recipient step once when the screen is ready", () => {
    const { result } = renderHook(() => useRecipientScreenViewModel());

    expect(result.current).toMatchObject({
      ready: true,
      account,
      currency: account.currency,
      recipientSupportsDomain: true,
      onClose: close,
    });
    expect(mockedTrackPage).toHaveBeenCalledTimes(1);
    expect(mockedTrackPage).toHaveBeenCalledWith(
      "Modal send - step recipient",
      null,
      expect.any(Object),
    );
  });

  it("updates the recipient and advances only when requested", () => {
    const { result } = renderHook(() => useRecipientScreenViewModel());

    if (!result.current.ready) {
      throw new Error("Expected a ready recipient screen");
    }
    const viewModel = result.current;

    act(() => {
      viewModel.onAddressSelected("next-address", "name.eth");
    });
    expect(setRecipient).toHaveBeenCalledWith({
      address: "next-address",
      ensName: "name.eth",
      memo: { type: "MEMO", value: "123" },
    });
    expect(goToNextStep).not.toHaveBeenCalled();

    act(() => {
      viewModel.onAddressSelected("next-address", "name.eth", true, {
        value: "",
        type: "NO_MEMO",
      });
    });
    expect(goToNextStep).toHaveBeenCalledTimes(1);
    expect(setRecipient).toHaveBeenLastCalledWith({
      address: "next-address",
      ensName: "name.eth",
      memo: { value: "", type: "NO_MEMO" },
    });
  });

  it("does not render the modal while the scanner is open", () => {
    mockedUseRecipientScanner.mockReturnValue({
      isScannerOpen: true,
      closeScanner: jest.fn(),
      toggleScanner: jest.fn(),
    });

    const { result } = renderHook(() => useRecipientScreenViewModel());

    expect(result.current).toEqual({ ready: false });
  });
});
