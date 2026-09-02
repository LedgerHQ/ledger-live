import { act, renderHook } from "@testing-library/react";
import type { RequestReceiveVerifyHint } from "../../../types";
import { useRequestReceiveView } from "../useRequestReceiveView.web";

function setup(overrides: { isOpen?: boolean; verifyHint?: RequestReceiveVerifyHint } = {}) {
  const onClose = jest.fn();
  const onCopy = jest.fn();
  const onGotIt = jest.fn();
  const { result } = renderHook(() =>
    useRequestReceiveView({
      isOpen: overrides.isOpen ?? true,
      onClose,
      onCopy,
      verifyHint: overrides.verifyHint ?? {
        open: true,
        message: "Verify your address",
        gotItLabel: "Got it",
        onGotIt,
      },
    }),
  );
  return { result, onClose, onCopy, onGotIt };
}

describe("useRequestReceiveView", () => {
  beforeEach(() => {
    // React 19 act() schedules work with queueMicrotask. Jest fake timers
    // mock that API by default, so act() never returns.
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps the hint closed until the show delay elapses", () => {
    const { result } = setup();

    expect(result.current.hint?.open).toBe(false);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.hint?.open).toBe(true);
  });

  it("does not close the dialog while the hint is open", () => {
    const { result, onClose } = setup();
    act(() => {
      jest.advanceTimersByTime(500);
    });

    const event = { preventDefault: jest.fn() } as unknown as CustomEvent;
    act(() => {
      result.current.handleOpenChange(false);
      result.current.handleInteractOutside(event);
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("closes the dialog after the hint is dismissed", () => {
    const onGotIt = jest.fn();
    const { result, onClose } = setup({
      verifyHint: {
        open: false,
        message: "Verify your address",
        gotItLabel: "Got it",
        onGotIt,
      },
    });

    act(() => {
      result.current.handleOpenChange(false);
    });

    expect(onClose).toHaveBeenCalled();
  });
});
