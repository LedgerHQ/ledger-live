import { getPostOnboardingHubSnapHeightPercent } from "../postOnboardingHubDrawerSnapPoints";

describe("getPostOnboardingHubSnapHeightPercent", () => {
  it.each([
    { totalSteps: 1, areAllActionsCompleted: false, expected: 37.5 },
    { totalSteps: 2, areAllActionsCompleted: false, expected: 45 },
    { totalSteps: 4, areAllActionsCompleted: false, expected: 60 },
    { totalSteps: 2, areAllActionsCompleted: true, expected: 52.5 },
    { totalSteps: 10, areAllActionsCompleted: false, expected: 92 },
    { totalSteps: 10, areAllActionsCompleted: true, expected: 92 },
  ])(
    "returns $expected% for $totalSteps steps when completed is $areAllActionsCompleted",
    ({ totalSteps, areAllActionsCompleted, expected }) => {
      expect(
        getPostOnboardingHubSnapHeightPercent(totalSteps, areAllActionsCompleted),
      ).toBe(expected);
    },
  );
});
