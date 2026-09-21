import React, { type ReactNode } from "react";
import { act, renderHook } from "tests/testSetup";
import { SendFlowTrackingProvider, useSendFlowTracking } from "../SendFlowTrackingContext";
import { track } from "~/renderer/analytics/segment";

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <SendFlowTrackingProvider>{children}</SendFlowTrackingProvider>;
}

describe("SendFlowTrackingContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps recipient resolution metadata for the whole Send flow", () => {
    const { result } = renderHook(() => useSendFlowTracking(), { wrapper });

    expect(result.current).toMatchObject({
      inputMethod: "manual",
      resultType: null,
      recipientType: null,
      savedContactDuringFlow: false,
    });

    act(() => {
      result.current.setInputMethod("paste");
      result.current.setRecipientResolution("contact address match", "contact");
      result.current.markContactSaved();
    });

    expect(result.current).toMatchObject({
      inputMethod: "paste",
      resultType: "contact address match",
      recipientType: "contact",
      savedContactDuringFlow: true,
    });
  });

  it("tracks a settled message after 500 ms and deduplicates it in the flow", () => {
    const { result } = renderHook(() => useSendFlowTracking(), { wrapper });
    const request = {
      account: null,
      step: "AMOUNT" as const,
      message: {
        messageId: "NotEnoughGas",
        messageType: "error" as const,
      },
    };

    act(() => {
      result.current.scheduleMessage(request);
      jest.advanceTimersByTime(499);
    });
    expect(track).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      "error_displayed",
      expect.objectContaining({
        flow_session_id: result.current.flowSessionId,
        step: "AMOUNT",
        message_id: "NotEnoughGas",
      }),
    );

    act(() => {
      result.current.scheduleMessage(request);
      jest.advanceTimersByTime(500);
    });
    expect(track).toHaveBeenCalledTimes(1);
  });

  it("flushes on blur without emitting again when the timer expires", () => {
    const { result } = renderHook(() => useSendFlowTracking(), { wrapper });

    act(() => {
      result.current.scheduleMessage({
        account: null,
        step: "COIN_CONTROL",
        message: {
          messageId: "NotEnoughBalance",
          messageType: "error",
        },
      });
      document.dispatchEvent(new Event("focusout"));
      jest.advanceTimersByTime(500);
    });

    expect(track).toHaveBeenCalledTimes(1);
  });

  it("tracks immediate messages and keeps the session stable across rerenders", () => {
    const { result, rerender } = renderHook(() => useSendFlowTracking(), {
      wrapper,
    });
    const flowSessionId = result.current.flowSessionId;

    act(() => {
      result.current.trackMessage({
        account: null,
        step: "RECIPIENT",
        message: {
          messageId: "sanctioned",
          messageType: "error",
        },
      });
    });
    rerender();

    expect(result.current.flowSessionId).toBe(flowSessionId);
    expect(track).toHaveBeenCalledTimes(1);
  });
});
