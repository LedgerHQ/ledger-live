import { act, renderHook } from "@testing-library/react-native";
import type { RequestReceiveVerifyHint } from "../../../types";
import { useRequestReceiveView } from "../useRequestReceiveView.native";

function setup(overrides: { verifyHint?: RequestReceiveVerifyHint } = {}) {
  const onClose = jest.fn();
  const onCopy = jest.fn();
  const onGotIt = jest.fn();
  const { result } = renderHook(() =>
    useRequestReceiveView({
      onClose,
      onCopy,
      verifyHint:
        "verifyHint" in overrides
          ? overrides.verifyHint
          : {
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
  it("keeps the host open flag", () => {
    const { result } = setup();

    expect(result.current.hint?.open).toBe(true);
  });

  it("does not close the screen while the hint is present", () => {
    const { result, onClose } = setup();

    act(() => {
      result.current.handleClose();
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes the screen after the hint is dismissed", () => {
    const { result, onClose } = setup({ verifyHint: undefined });

    act(() => {
      result.current.handleClose();
    });

    expect(onClose).toHaveBeenCalled();
  });
});
