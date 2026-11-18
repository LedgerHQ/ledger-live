import { renderHook } from "@testing-library/react-native";
import {
  useConfirmSkipAfterUpdateScreen,
  type UpdateScreenReturnInput,
} from "./useConfirmSkipAfterUpdateScreen";

function renderReturn(initial: UpdateScreenReturnInput) {
  return renderHook((input: UpdateScreenReturnInput) => useConfirmSkipAfterUpdateScreen(input), {
    initialProps: initial,
  });
}

describe("useConfirmSkipAfterUpdateScreen", () => {
  it("should not ask to confirm a first offer", () => {
    const { result } = renderReturn({ updateScreenOpen: false, recheckingUpdate: true });

    expect(result.current).toBe(false);
  });

  it("should ask to confirm the skip once the user leaves the update screen without updating", () => {
    const { result, rerender } = renderReturn({ updateScreenOpen: true, recheckingUpdate: false });

    rerender({ updateScreenOpen: false, recheckingUpdate: true });

    expect(result.current).toBe(true);
  });

  it("should stop asking once the re-offered update is answered", () => {
    const { result, rerender } = renderReturn({ updateScreenOpen: true, recheckingUpdate: false });

    rerender({ updateScreenOpen: false, recheckingUpdate: true });
    rerender({ updateScreenOpen: false, recheckingUpdate: false });

    expect(result.current).toBe(false);
  });

  it("should not ask after the update rebooted the device", () => {
    const { result, rerender } = renderReturn({ updateScreenOpen: true, recheckingUpdate: false });

    rerender({ updateScreenOpen: false, recheckingUpdate: false });

    expect(result.current).toBe(false);
  });
});
