import React, { type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { Keyboard } from "react-native";
import { track } from "~/analytics";
import { SendFlowTrackingProvider, useSendFlowTracking } from "../SendFlowTrackingContext";

jest.mock("~/analytics");

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
    jest.restoreAllMocks();
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

  it("clears the recipient resolution without losing the other tracking metadata", () => {
    const { result } = renderHook(() => useSendFlowTracking(), { wrapper });

    act(() => {
      result.current.setInputMethod("paste");
      result.current.setRecipientResolution("contact address match", "contact");
      result.current.markContactSaved();
    });

    act(() => {
      result.current.resetRecipientResolution();
    });

    expect(result.current).toMatchObject({
      inputMethod: "paste",
      resultType: null,
      recipientType: null,
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

  it("flushes when the keyboard is dismissed without emitting again when the timer expires", () => {
    let onKeyboardDidHide: (() => void) | undefined;
    jest.spyOn(Keyboard, "addListener").mockImplementation((eventName, listener) => {
      if (eventName === "keyboardDidHide") onKeyboardDidHide = listener as () => void;
      return { remove: jest.fn() } as never;
    });
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
    });
    act(() => {
      onKeyboardDidHide?.();
    });
    expect(track).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(track).toHaveBeenCalledTimes(1);
  });

  it("keeps pending messages independent per step", () => {
    const { result } = renderHook(() => useSendFlowTracking(), { wrapper });

    act(() => {
      result.current.scheduleMessage({
        account: null,
        step: "AMOUNT",
        message: {
          messageId: "NotEnoughBalance",
          messageType: "error",
        },
      });
      jest.advanceTimersByTime(200);
      result.current.scheduleMessage({
        account: null,
        step: "RECIPIENT",
        message: {
          messageId: "InvalidAddress",
          messageType: "error",
        },
      });
      jest.advanceTimersByTime(300);
    });

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      "error_displayed",
      expect.objectContaining({
        step: "AMOUNT",
        message_id: "NotEnoughBalance",
      }),
    );

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(track).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenLastCalledWith(
      "error_displayed",
      expect.objectContaining({
        step: "RECIPIENT",
        message_id: "InvalidAddress",
      }),
    );
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
    rerender({});

    expect(result.current.flowSessionId).toBe(flowSessionId);
    expect(track).toHaveBeenCalledTimes(1);
  });

  it("drops pending and new messages once the session has ended", () => {
    const { result } = renderHook(() => useSendFlowTracking(), { wrapper });
    const request = {
      account: null,
      step: "SIGNATURE" as const,
      message: {
        messageId: "LockedDeviceError",
        messageType: "error" as const,
      },
    };

    act(() => {
      result.current.scheduleMessage(request);
      result.current.endSession();
      jest.advanceTimersByTime(500);
      result.current.trackMessage(request);
    });

    expect(track).not.toHaveBeenCalled();
  });
});
