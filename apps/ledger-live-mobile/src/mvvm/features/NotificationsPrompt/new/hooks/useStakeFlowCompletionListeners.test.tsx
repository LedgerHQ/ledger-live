import React from "react";
import { renderHook } from "@testing-library/react-native";
import { NotificationsPromptContext } from "LLM/features/NotificationsPrompt/new/NotificationsPromptProvider";
import { useStakeFlowCompletionListeners } from "./useStakeFlowCompletionListeners";

describe("useStakeFlowCompletionListeners", () => {
  const notifyFlowCompleted = jest.fn();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationsPromptContext.Provider
      value={{
        notifyFlowCompleted,
        tryTriggerPushNotificationDrawerAfterInactivity: jest.fn(),
      }}
    >
      {children}
    </NotificationsPromptContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should trigger the stake notification prompt when the success screen is removed", () => {
    const { result } = renderHook(() => useStakeFlowCompletionListeners(), { wrapper });

    expect(notifyFlowCompleted).not.toHaveBeenCalled();

    result.current.beforeRemove();

    expect(notifyFlowCompleted).toHaveBeenCalledTimes(1);
    expect(notifyFlowCompleted).toHaveBeenCalledWith("stake");
  });

  it("should keep a stable listeners reference across re-renders", () => {
    const { result, rerender } = renderHook(() => useStakeFlowCompletionListeners(), { wrapper });
    const first = result.current;

    rerender({});

    expect(result.current).toBe(first);
  });
});
