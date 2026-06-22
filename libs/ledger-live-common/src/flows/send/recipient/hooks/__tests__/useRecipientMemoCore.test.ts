/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { useRecipientMemoCore } from "../useRecipientMemoCore";

type Params = Parameters<typeof useRecipientMemoCore>[0];

function setup(overrides: Partial<Params> = {}) {
  const onMemoChange = jest.fn();
  const onMemoSkip = jest.fn();
  const setDoNotAskAgainSkipMemo = jest.fn();
  const initialProps: Params = {
    hasMemo: true,
    memoType: "text",
    memoTypeOptions: undefined,
    memoDefaultOption: undefined,
    onMemoChange,
    onMemoSkip,
    resetKey: "acc|xrp|addr",
    doNotAskAgainSkipMemo: false,
    setDoNotAskAgainSkipMemo,
    ...overrides,
  };
  const utils = renderHook((props: Params) => useRecipientMemoCore(props), { initialProps });
  return { ...utils, onMemoChange, onMemoSkip, setDoNotAskAgainSkipMemo, initialProps };
}

describe("useRecipientMemoCore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    const { result, onMemoSkip } = setup({ doNotAskAgainSkipMemo: true });
    act(() => result.current.onSkipMemoRequestConfirm());
    expect(result.current.skipMemoState).toBe("confirmed");
    expect(onMemoSkip).toHaveBeenCalledTimes(1);
  });

  it("persists the do-not-ask-again preference on confirm", () => {
    const { result, setDoNotAskAgainSkipMemo } = setup();
    act(() => result.current.onSkipMemoRequestConfirm());
    act(() => result.current.onSkipMemoConfirm(true));
    expect(setDoNotAskAgainSkipMemo).toHaveBeenCalledWith(true);
  });

  it("does not allow skipping when the chain has no memo", () => {
    const { result } = setup({ hasMemo: false });
    expect(result.current.showSkipMemo).toBe(false);
  });

  it("resets state when the resetKey changes", () => {
    const { result, onMemoChange, rerender, initialProps } = setup();
    act(() => result.current.onMemoValueChange("123"));
    onMemoChange.mockClear();

    rerender({ ...initialProps, resetKey: "acc|xrp|other" });
    expect(onMemoChange).toHaveBeenLastCalledWith({ value: "", type: undefined });
    expect(result.current.memo).toEqual({ value: "", type: undefined });
    expect(result.current.skipMemoState).toBe("propose");
  });
});
