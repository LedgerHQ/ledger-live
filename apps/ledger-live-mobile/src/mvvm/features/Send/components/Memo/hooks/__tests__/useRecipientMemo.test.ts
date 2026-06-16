import { act, renderHook } from "@testing-library/react-native";
import { useRecipientMemo } from "../useRecipientMemo";

const mockSetDoNotAskAgain = jest.fn();
let mockDoNotAskAgain = false;

jest.mock("../useDoNotAskAgainSkipMemo", () => ({
  useDoNotAskAgainSkipMemo: () => [mockDoNotAskAgain, mockSetDoNotAskAgain],
}));

function setup(overrides: Partial<Parameters<typeof useRecipientMemo>[0]> = {}) {
  const onMemoChange = jest.fn();
  const onMemoSkip = jest.fn();
  const initialProps: Parameters<typeof useRecipientMemo>[0] = {
    hasMemo: true,
    memoType: "text",
    memoTypeOptions: undefined,
    memoDefaultOption: undefined,
    onMemoChange,
    onMemoSkip,
    resetKey: "acc|xrp|addr",
    ...overrides,
  };
  const utils = renderHook(
    (props: Parameters<typeof useRecipientMemo>[0]) => useRecipientMemo(props),
    { initialProps },
  );
  return { ...utils, onMemoChange, onMemoSkip, initialProps };
}

describe("useRecipientMemo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoNotAskAgain = false;
  });

  it("shows the type selector only for typed memos with options", () => {
    const typed = setup({ memoType: "typed", memoTypeOptions: ["NO_MEMO", "MEMO_TEXT"] });
    expect(typed.result.current.hasMemoTypeOptions).toBe(true);

    const text = setup({ memoType: "text", memoTypeOptions: undefined });
    expect(text.result.current.hasMemoTypeOptions).toBe(false);
  });

  it("propagates value changes and keeps showing the input", () => {
    const { result, onMemoChange } = setup();
    act(() => result.current.onMemoValueChange("123"));
    expect(onMemoChange).toHaveBeenLastCalledWith({ value: "123", type: undefined });
    expect(result.current.showMemoValueInput).toBe(true);
  });

  it("resets the value when the memo type changes", () => {
    const { result, onMemoChange } = setup({
      memoType: "typed",
      memoTypeOptions: ["NO_MEMO", "MEMO_TEXT", "MEMO_ID"],
    });
    act(() => result.current.onMemoValueChange("abc"));
    act(() => result.current.onMemoTypeChange("MEMO_ID"));
    expect(onMemoChange).toHaveBeenLastCalledWith({ value: "", type: "MEMO_ID" });
    expect(result.current.memo).toEqual({ value: "", type: "MEMO_ID" });
  });

  it("runs the skip flow propose -> toConfirm -> confirmed and proceeds", () => {
    const { result, onMemoChange, onMemoSkip } = setup();
    expect(result.current.skipMemoState).toBe("propose");

    act(() => result.current.onSkipMemoRequestConfirm());
    expect(result.current.skipMemoState).toBe("toConfirm");

    act(() => result.current.onSkipMemoConfirm(false));
    expect(result.current.skipMemoState).toBe("confirmed");
    expect(onMemoChange).toHaveBeenLastCalledWith({ value: "", type: "NO_MEMO" });
    expect(onMemoSkip).toHaveBeenCalledTimes(1);
  });

  it("skips immediately when the user opted out of the confirmation", () => {
    mockDoNotAskAgain = true;
    const { result, onMemoSkip } = setup();
    act(() => result.current.onSkipMemoRequestConfirm());
    expect(result.current.skipMemoState).toBe("confirmed");
    expect(onMemoSkip).toHaveBeenCalledTimes(1);
  });

  it("persists the do-not-ask-again preference on confirm", () => {
    const { result } = setup();
    act(() => result.current.onSkipMemoRequestConfirm());
    act(() => result.current.onSkipMemoConfirm(true));
    expect(mockSetDoNotAskAgain).toHaveBeenCalledWith(true);
  });

  it("does not allow skipping when the chain has no memo", () => {
    const { result } = setup({ hasMemo: false });
    expect(result.current.showSkipMemo).toBe(false);
  });
});
