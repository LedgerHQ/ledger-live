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
    const { result } = renderReturn({ returnsWithoutUpdate: 0, recheckingUpdate: true });

    expect(result.current).toBe(false);
  });

  it("should ask to confirm the skip once the user comes back without updating", () => {
    const { result, rerender } = renderReturn({ returnsWithoutUpdate: 0, recheckingUpdate: false });

    rerender({ returnsWithoutUpdate: 1, recheckingUpdate: false });
    rerender({ returnsWithoutUpdate: 1, recheckingUpdate: true });

    expect(result.current).toBe(true);
  });

  it("should stop asking once the re-offered update is answered", () => {
    const { result, rerender } = renderReturn({ returnsWithoutUpdate: 0, recheckingUpdate: false });

    rerender({ returnsWithoutUpdate: 1, recheckingUpdate: true });
    rerender({ returnsWithoutUpdate: 1, recheckingUpdate: false });

    expect(result.current).toBe(false);
  });

  it("should not ask when the update screen never opened", () => {
    const { result, rerender } = renderReturn({ returnsWithoutUpdate: 0, recheckingUpdate: false });

    rerender({ returnsWithoutUpdate: 0, recheckingUpdate: true });

    expect(result.current).toBe(false);
  });
});
