import { act, renderHook } from "@testing-library/react-native";
import type { RequestReceiveVerifyHint } from "../../../types";
import { useRequestReceiveView } from "../useRequestReceiveView.native";

function setup(overrides: { verifyHint?: RequestReceiveVerifyHint; copied?: boolean } = {}) {
  const onClose = jest.fn();
  const onCopy = jest.fn().mockResolvedValue(overrides.copied ?? true);
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

  it("shows copied feedback once the copy succeeded", async () => {
    const { result, onCopy } = setup();

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(result.current.hasCopied).toBe(true);
  });

  it("does not show copied feedback when the copy failed", async () => {
    const { result } = setup({ copied: false });

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(result.current.hasCopied).toBe(false);
  });
});
