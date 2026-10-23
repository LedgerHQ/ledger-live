import { act, renderHook } from "@testing-library/react";
import { INTENT_TEMPLATE, useWriteForm } from "./useWriteForm";

describe("useWriteForm", () => {
  it("starts from a valid intent template, so the fee can be estimated and the intent encoded", () => {
    const { result } = renderHook(() => useWriteForm("ethereum"));
    expect(result.current.intentJson).toBe(INTENT_TEMPLATE);
    expect(result.current.canEstimate).toBe(true);
    expect(result.current.canEncode).toBe(true);
  });

  it("refuses an intent that is not a JSON object", () => {
    const { result } = renderHook(() => useWriteForm("ethereum"));
    act(() => result.current.setIntentJson("[1]"));
    expect(result.current.intentValid).toBe(false);
    expect(result.current.canEstimate).toBe(false);
    expect(result.current.canEncode).toBe(false);
  });

  it("cannot do anything without a network", () => {
    const { result } = renderHook(() => useWriteForm("  "));
    expect(result.current.canEstimate).toBe(false);
    expect(result.current.canEncode).toBe(false);
  });

  it("combines only once the raw transaction and the signature are both there", () => {
    const { result } = renderHook(() => useWriteForm("ethereum"));
    act(() => result.current.setRawTransaction("0xraw"));
    expect(result.current.canCombine).toBe(false);
    act(() => result.current.setSignature("0xsig"));
    expect(result.current.canCombine).toBe(true);
  });

  it("broadcasts only a signed transaction the user confirmed", () => {
    const { result } = renderHook(() => useWriteForm("ethereum"));
    act(() => result.current.setSignedTransaction("0xsigned"));
    expect(result.current.canBroadcast).toBe(false);

    act(() => result.current.setConfirmBroadcast(true));
    expect(result.current.canBroadcast).toBe(true);

    act(() => result.current.setSignedTransaction("  "));
    expect(result.current.canBroadcast).toBe(false);
  });
});
