import { returnToPreviousScreen } from "./returnToPreviousScreen";

function syncOnboardingNavigation() {
  const parent = { goBack: jest.fn() };
  const navigation = { getParent: () => parent };
  return { navigation, parent };
}

describe("returnToPreviousScreen", () => {
  it("should go back to the screen below Sync Onboarding when it was opened above it", () => {
    const { navigation, parent } = syncOnboardingNavigation();

    expect(returnToPreviousScreen(navigation, true)).toBe(true);
    expect(parent.goBack).toHaveBeenCalledTimes(1);
  });

  it.each([false, undefined])(
    "should leave the exit to the caller when backReturnsToPrevious is %s",
    backReturnsToPrevious => {
      const { navigation, parent } = syncOnboardingNavigation();

      expect(returnToPreviousScreen(navigation, backReturnsToPrevious)).toBe(false);
      expect(parent.goBack).not.toHaveBeenCalled();
    },
  );
});
