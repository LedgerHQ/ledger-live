import { act, renderHook } from "@testing-library/react-native";
import { Linking } from "react-native";
import { track } from "~/analytics";
import { useSkipMemoConfirmationViewModel } from "../useSkipMemoConfirmationViewModel";
import { useSendFlowData } from "../../../../context/SendFlowContext";
import { useDoNotAskAgainSkipMemo } from "../../../../hooks/useDoNotAskAgainSkipMemo";

jest.mock("~/analytics", () => ({ track: jest.fn() }));
jest.mock("../../../../context/SendFlowContext");
jest.mock("../../../../hooks/useDoNotAskAgainSkipMemo");
jest.mock("LLM/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: () => "https://support.ledger.com/memo",
}));
jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({
    t: (key: string, params?: { tag?: string }) => (params?.tag ? `${key}:${params.tag}` : key),
  }),
}));

const mockedUseSendFlowData = jest.mocked(useSendFlowData);
const mockedUseDoNotAskAgainSkipMemo = jest.mocked(useDoNotAskAgainSkipMemo);
const mockedTrack = jest.mocked(track);
const mockedOpenURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

const onClose = jest.fn();
const onConfirmed = jest.fn();
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
    mockedUseDoNotAskAgainSkipMemo.mockReturnValue([false, setDoNotAskAgainSkipMemo]);
  });

  it("hands the confirmed skip back to the recipient step", () => {
    const { result } = renderHook(() => useSkipMemoConfirmationViewModel({ onClose, onConfirmed }));

    act(() => result.current.onDoNotAskAgainChange(true));
    act(() => result.current.onConfirm());

    expect(setDoNotAskAgainSkipMemo).toHaveBeenCalledWith(true);
    expect(mockedTrack).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "skip memo", page: "step memo warning" }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirmed).toHaveBeenCalledTimes(1);
  });

  it("returns to the recipient step", () => {
    const { result } = renderHook(() => useSkipMemoConfirmationViewModel({ onClose, onConfirmed }));

    act(() => result.current.onCancel());

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirmed).not.toHaveBeenCalled();
  });

  it("opens the memo FAQ", () => {
    const { result } = renderHook(() => useSkipMemoConfirmationViewModel({ onClose, onConfirmed }));

    act(() => result.current.onLearnMore());

    expect(mockedOpenURL).toHaveBeenCalledWith("https://support.ledger.com/memo");
  });
});
