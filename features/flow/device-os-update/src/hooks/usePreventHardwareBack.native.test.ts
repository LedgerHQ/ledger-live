import { BackHandler } from "react-native";
import { renderHook } from "@testing-library/react-native";
import { usePreventHardwareBack } from "./usePreventHardwareBack";

const addEventListener = jest.mocked(BackHandler.addEventListener);

describe("usePreventHardwareBack", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("swallows the Android back button while active", () => {
    renderHook(() => usePreventHardwareBack(true));

    expect(addEventListener).toHaveBeenCalledWith("hardwareBackPress", expect.any(Function));
    const onBackPress = addEventListener.mock.calls[0][1];
    expect(onBackPress()).toBe(true);
  });

  it("leaves the back button alone while inactive", () => {
    renderHook(() => usePreventHardwareBack(false));

    expect(addEventListener).not.toHaveBeenCalled();
  });

  it("releases the back button once inactive again", () => {
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => usePreventHardwareBack(active),
      {
        initialProps: { active: true },
      },
    );
    const subscription = addEventListener.mock.results[0].value;

    rerender({ active: false });

    expect(subscription.remove).toHaveBeenCalledTimes(1);
  });
});
