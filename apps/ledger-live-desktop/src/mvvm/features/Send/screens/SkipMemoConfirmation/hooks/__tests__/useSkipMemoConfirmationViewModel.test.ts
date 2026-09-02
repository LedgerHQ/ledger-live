import { act, renderHook } from "tests/testSetup";
import { useSkipMemoConfirmationViewModel } from "../useSkipMemoConfirmationViewModel";
import { useSendFlowActions, useSendFlowData } from "../../../../context/SendFlowContext";
import { useFlowWizard } from "../../../../../FlowWizard/FlowWizardContext";
import { useDoNotAskAgainSkipMemo } from "../../../../hooks/useDoNotAskAgainSkipMemo";
import { openURL } from "~/renderer/linking";

jest.mock("../../../../context/SendFlowContext");
jest.mock("../../../../../FlowWizard/FlowWizardContext");
jest.mock("../../../../hooks/useDoNotAskAgainSkipMemo");
jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: () => "https://support.ledger.com/memo",
}));
jest.mock("~/renderer/linking", () => ({ openURL: jest.fn() }));
jest.mock("~/renderer/analytics/segment", () => ({ track: jest.fn() }));

const mockedUseSendFlowActions = jest.mocked(useSendFlowActions);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseFlowWizard = jest.mocked(useFlowWizard);
const mockedUseDoNotAskAgainSkipMemo = jest.mocked(useDoNotAskAgainSkipMemo);
const mockedOpenURL = jest.mocked(openURL);

const setRecipient = jest.fn();
const goToStep = jest.fn();
const resetToStep = jest.fn();
const setDoNotAskAgainSkipMemo = jest.fn();

describe("useSkipMemoConfirmationViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSendFlowData.mockReturnValue({
      state: {
        account: { account: null, parentAccount: null, currency: null },
        recipient: { address: "recipient" },
      },
    } as never);
    mockedUseSendFlowActions.mockReturnValue({
      transaction: { setRecipient },
    } as never);
    mockedUseFlowWizard.mockReturnValue({
      navigation: { goToStep, resetToStep },
    } as never);
    mockedUseDoNotAskAgainSkipMemo.mockReturnValue([false, setDoNotAskAgainSkipMemo]);
  });

  it("sets NO_MEMO and continues to the amount step", () => {
    const { result } = renderHook(() => useSkipMemoConfirmationViewModel());

    act(() => result.current.onDoNotAskAgainChange(true));
    act(() => result.current.onConfirm());

    expect(setDoNotAskAgainSkipMemo).toHaveBeenCalledWith(true);
    expect(setRecipient).toHaveBeenCalledWith({
      address: "recipient",
      memo: { value: "", type: "NO_MEMO" },
    });
    expect(resetToStep).toHaveBeenCalledWith("RECIPIENT");
    expect(goToStep).toHaveBeenCalledWith("AMOUNT");
  });

  it("returns to the recipient step", () => {
    const { result } = renderHook(() => useSkipMemoConfirmationViewModel());

    act(() => result.current.onCancel());

    expect(resetToStep).toHaveBeenCalledWith("RECIPIENT");
    expect(goToStep).not.toHaveBeenCalled();
  });

  it("opens the memo FAQ", () => {
    const { result } = renderHook(() => useSkipMemoConfirmationViewModel());

    act(() => result.current.onLearnMore());

    expect(mockedOpenURL).toHaveBeenCalledWith("https://support.ledger.com/memo");
  });
});
