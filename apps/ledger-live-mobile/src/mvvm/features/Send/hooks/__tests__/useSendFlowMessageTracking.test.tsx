import React, { type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { useIsFocused } from "@react-navigation/native";
import { track } from "~/analytics";
import { SendFlowTrackingProvider } from "../../context/SendFlowTrackingContext";
import { useSendFlowMessageTracking } from "../useSendFlowMessageTracking";

jest.mock("~/analytics");
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: jest.fn(() => true),
}));

const request = {
  account: null,
  step: "AMOUNT" as const,
  message: {
    messageId: "NotEnoughBalance",
    messageType: "error" as const,
  },
};

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <SendFlowTrackingProvider>{children}</SendFlowTrackingProvider>;
}

describe("useSendFlowMessageTracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useIsFocused).mockReturnValue(true);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not track during a transient window", () => {
    const { rerender } = renderHook(
      ({ isTransient }: { isTransient: boolean }) =>
        useSendFlowMessageTracking({
          step: "AMOUNT",
          request,
          isTransient,
        }),
      {
        wrapper,
        initialProps: { isTransient: true },
      },
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(track).not.toHaveBeenCalled();

    rerender({ isTransient: false });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(track).toHaveBeenCalledTimes(1);
  });

  it("tracks an immediate message without waiting for the debounce", () => {
    renderHook(
      () =>
        useSendFlowMessageTracking({
          step: "AMOUNT",
          request,
          immediate: true,
        }),
      { wrapper },
    );

    expect(track).toHaveBeenCalledTimes(1);
  });

  it("does not restart the debounce for an equivalent request", () => {
    const { rerender } = renderHook(
      () =>
        useSendFlowMessageTracking({
          step: "AMOUNT",
          request: { ...request, metadata: { recipientLength: 10 } },
        }),
      { wrapper },
    );

    act(() => {
      jest.advanceTimersByTime(400);
    });
    rerender({});
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(track).toHaveBeenCalledTimes(1);
  });

  it("cancels the pending message when it disappears before the debounce", () => {
    const { rerender } = renderHook(
      ({ current }: { current: typeof request | null }) =>
        useSendFlowMessageTracking({ step: "AMOUNT", request: current }),
      { wrapper, initialProps: { current: request as typeof request | null } },
    );

    act(() => {
      jest.advanceTimersByTime(300);
    });
    rerender({ current: null });
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("does not track while the screen is unfocused", () => {
    jest.mocked(useIsFocused).mockReturnValue(false);

    renderHook(() => useSendFlowMessageTracking({ step: "AMOUNT", request }), {
      wrapper,
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(track).not.toHaveBeenCalled();
  });
});
