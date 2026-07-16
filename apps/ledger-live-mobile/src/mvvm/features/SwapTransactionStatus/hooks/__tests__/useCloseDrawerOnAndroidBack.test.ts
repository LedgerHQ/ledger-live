import { BackHandler } from "react-native";
import { renderHook } from "@tests/test-renderer";
import { useCloseDrawerOnAndroidBack } from "../useCloseDrawerOnAndroidBack";

describe("useCloseDrawerOnAndroidBack", () => {
  let backPressHandlers: Array<() => boolean | null | undefined>;

  // Mirrors RN's BackHandler: invokes registered handlers most-recent-first until one
  // returns true. Other handlers in the render tree (e.g. navigation) register too.
  const simulateHardwareBackPress = () => {
    for (let i = backPressHandlers.length - 1; i >= 0; i--) {
      if (backPressHandlers[i]()) return true;
    }
    return false;
  };

  beforeEach(() => {
    backPressHandlers = [];
    jest.spyOn(BackHandler, "addEventListener").mockImplementation((event, handler) => {
      if (event === "hardwareBackPress") {
        backPressHandlers.push(handler);
      }
      return {
        remove: () => {
          const index = backPressHandlers.indexOf(handler);
          if (index >= 0) backPressHandlers.splice(index, 1);
        },
      } as ReturnType<typeof BackHandler.addEventListener>;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("closes the drawer and consumes the back press when open", () => {
    const onClose = jest.fn();
    renderHook(() => useCloseDrawerOnAndroidBack(true, onClose));

    const handled = simulateHardwareBackPress();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(handled).toBe(true);
  });

  it("does nothing when the drawer is closed", () => {
    const onClose = jest.fn();
    renderHook(() => useCloseDrawerOnAndroidBack(false, onClose));

    simulateHardwareBackPress();

    expect(onClose).not.toHaveBeenCalled();
  });

  it("stops handling back once the drawer closes", () => {
    const onClose = jest.fn();
    let isOpen = true;
    const { rerender } = renderHook(() => useCloseDrawerOnAndroidBack(isOpen, onClose));

    isOpen = false;
    rerender(undefined);
    simulateHardwareBackPress();

    expect(onClose).not.toHaveBeenCalled();
  });
});
