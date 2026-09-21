import React, { type ReactNode } from "react";
import { act, renderHook } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { SendFlowTrackingProvider } from "../../context/SendFlowTrackingContext";
import { useSendFlowMessageTracking } from "../useSendFlowMessageTracking";

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
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not track during a transient window", () => {
    const { rerender } = renderHook(
      ({ isTransient }) =>
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
    rerender();
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(track).toHaveBeenCalledTimes(1);
  });
});
