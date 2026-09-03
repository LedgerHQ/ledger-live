import { act, renderHook } from "@testing-library/react-native";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { useSkipMemoConfirmationViewModel } from "../useSkipMemoConfirmationViewModel";
import { useSendFlowActions, useSendFlowData } from "../../../../context/SendFlowContext";
import { useSendMemoReset } from "../../../../context/SendMemoResetContext";
import { useDoNotAskAgainSkipMemo } from "../../../../hooks/useDoNotAskAgainSkipMemo";

jest.mock("@react-navigation/native");
jest.mock("~/analytics", () => ({ track: jest.fn() }));
jest.mock("../../../../context/SendFlowContext");
jest.mock("../../../../context/SendMemoResetContext");
jest.mock("../../../../hooks/useDoNotAskAgainSkipMemo");
jest.mock("LLM/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: () => "https://support.ledger.com/memo",
}));
jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({
    t: (key: string, params?: { tag?: string }) => (params?.tag ? `${key}:${params.tag}` : key),
  }),
}));

const mockedUseSendFlowActions = jest.mocked(useSendFlowActions);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseSendMemoReset = jest.mocked(useSendMemoReset);
const mockedUseDoNotAskAgainSkipMemo = jest.mocked(useDoNotAskAgainSkipMemo);
const mockedUseNavigation = jest.mocked(useNavigation);
const mockedTrack = jest.mocked(track);
const mockedOpenURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

const setRecipient = jest.fn();
const navigate = jest.fn();
const onClose = jest.fn();
const setDoNotAskAgainSkipMemo = jest.fn();
const markMemoSkipped = jest.fn();

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
    mockedUseSendMemoReset.mockReturnValue({
      markMemoSkipped,
      registerResetViewState: jest.fn(),
      resetViewState: jest.fn(),
    });
    mockedUseNavigation.mockReturnValue({ navigate } as never);
    mockedUseDoNotAskAgainSkipMemo.mockReturnValue([false, setDoNotAskAgainSkipMemo]);
  });

  it("sets NO_MEMO and continues to the amount step", () => {
    const { result } = renderHook(() => useSkipMemoConfirmationViewModel({ onClose }));

    act(() => result.current.onDoNotAskAgainChange(true));
    act(() => result.current.onConfirm());

    expect(setDoNotAskAgainSkipMemo).toHaveBeenCalledWith(true);
    expect(markMemoSkipped).toHaveBeenCalledTimes(1);
    expect(setRecipient).toHaveBeenCalledWith({
      address: "recipient",
      memo: { value: "", type: "NO_MEMO" },
    });
    expect(mockedTrack).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "skip memo", page: "step memo warning" }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(ScreenName.SendFlowAmount);
  });

  it("returns to the recipient step", () => {
    const { result } = renderHook(() => useSkipMemoConfirmationViewModel({ onClose }));

    act(() => result.current.onCancel());

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("opens the memo FAQ", () => {
    const { result } = renderHook(() => useSkipMemoConfirmationViewModel({ onClose }));

    act(() => result.current.onLearnMore());

    expect(mockedOpenURL).toHaveBeenCalledWith("https://support.ledger.com/memo");
  });
});
