import { renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useOnboardingWidgetViewModel } from "../useOnboardingWidgetViewModel";

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index");
jest.mock("~/logic/postOnboarding/useNavigateToPostOnboardingHubCallback", () => ({
  useNavigateToPostOnboardingHubCallback: () => jest.fn(),
}));

const mockedUsePostOnboardingHubState = jest.mocked(usePostOnboardingHubState);

const makeAction = (completed: boolean) => ({
  completed,
  id: "mock" as never,
  Icon: (() => null) as const,
  title: "",
  titleCompleted: "",
});

describe("useOnboardingWidgetViewModel", () => {
  it.each([
    { completed: 0, total: 3, expectedStep: 0, expectedTotal: 4, expectedLabel: "1/4" },
    { completed: 1, total: 3, expectedStep: 1, expectedTotal: 4, expectedLabel: "2/4" },
    { completed: 2, total: 3, expectedStep: 2, expectedTotal: 4, expectedLabel: "3/4" },
    { completed: 3, total: 3, expectedStep: 3, expectedTotal: 4, expectedLabel: "4/4" },
    { completed: 0, total: 4, expectedStep: 0, expectedTotal: 5, expectedLabel: "1/5" },
  ])(
    "should return $expectedStep/$expectedTotal (label $expectedLabel) when $completed of $total actions completed",
    ({ completed, total, expectedStep, expectedTotal, expectedLabel }) => {
      const actions = Array.from({ length: total }, (_, i) => makeAction(i < completed));
      mockedUsePostOnboardingHubState.mockReturnValue({
        deviceModelId: DeviceModelId.nanoX,
        actionsState: actions,
        lastActionCompleted: null,
        postOnboardingInProgress: true,
      });

      const { result } = renderHook(() => useOnboardingWidgetViewModel());

      expect(result.current.currentStep).toBe(expectedStep);
      expect(result.current.totalSteps).toBe(expectedTotal);
      expect(result.current.stepperLabel).toBe(expectedLabel);
    },
  );
});
