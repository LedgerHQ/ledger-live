import { act, renderHook } from "@testing-library/react-native";
import React, { type ReactNode } from "react";
import {
  RecipientInputFocusProvider,
  useRecipientInputFocus,
} from "../../../../context/RecipientInputFocusContext";
import { useSettleRecipientInputFocus } from "../useSettleRecipientInputFocus";

const SETTLE_DELAY_MS = 400;

function renderSettle(hasContent: boolean) {
  return renderHook(
    (props: { hasContent: boolean }) => {
      useSettleRecipientInputFocus(props.hasContent);
      return useRecipientInputFocus();
    },
    {
      initialProps: { hasContent },
      wrapper: ({ children }: { children: ReactNode }) => (
        <RecipientInputFocusProvider>{children}</RecipientInputFocusProvider>
      ),
    },
  );
}

describe("useSettleRecipientInputFocus", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("hands the keyboard over once an empty step stopped changing", () => {
    const { result } = renderSettle(false);

    act(() => {
      jest.advanceTimersByTime(SETTLE_DELAY_MS);
    });

    expect(result.current.isRecipientInputFocusSettled).toBe(true);
    expect(result.current.shouldFocusRecipientInput).toBe(true);
  });

  it("holds the decision back while the step is still filling in", () => {
    const { result, rerender } = renderSettle(false);

    act(() => {
      jest.advanceTimersByTime(SETTLE_DELAY_MS - 1);
    });
    expect(result.current.isRecipientInputFocusSettled).toBe(false);

    rerender({ hasContent: true });
    act(() => {
      jest.advanceTimersByTime(SETTLE_DELAY_MS);
    });

    expect(result.current.isRecipientInputFocusSettled).toBe(true);
    expect(result.current.shouldFocusRecipientInput).toBe(false);
  });

  it("keeps the keyboard away when the step already has content", () => {
    const { result } = renderSettle(true);

    act(() => {
      jest.advanceTimersByTime(SETTLE_DELAY_MS);
    });

    expect(result.current.shouldFocusRecipientInput).toBe(false);
  });

  it("never revisits its decision once settled", () => {
    const { result, rerender } = renderSettle(false);

    act(() => {
      jest.advanceTimersByTime(SETTLE_DELAY_MS);
    });

    rerender({ hasContent: true });
    act(() => {
      jest.advanceTimersByTime(SETTLE_DELAY_MS * 10);
    });

    expect(result.current.shouldFocusRecipientInput).toBe(true);
  });
});
