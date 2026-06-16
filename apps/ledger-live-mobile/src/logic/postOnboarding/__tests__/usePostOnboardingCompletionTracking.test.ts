import { renderHook } from "@testing-library/react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { track } from "~/analytics";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { usePostOnboardingHubStepperDisplay } from "../usePostOnboardingHubStepperDisplay";
import { usePostOnboardingCompletionTracking } from "../usePostOnboardingCompletionTracking";

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index", () => ({
  usePostOnboardingHubState: jest.fn(),
}));
jest.mock("../usePostOnboardingHubStepperDisplay", () => ({
  usePostOnboardingHubStepperDisplay: jest.fn(),
}));

const mockedTrack = track as jest.Mock;
const mockedHubState = usePostOnboardingHubState as jest.Mock;
const mockedStepper = usePostOnboardingHubStepperDisplay as jest.Mock;

type Stepper = { areAllActionsCompleted: boolean; loading: boolean };

const setStepper = ({ areAllActionsCompleted, loading }: Stepper) =>
  mockedStepper.mockReturnValue({ areAllActionsCompleted, loading });

// A single populated action is enough for the tracking hook's "ready" check.
const ACTIONS_STATE = [{ id: "claimMock" }];

describe("usePostOnboardingCompletionTracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedHubState.mockReturnValue({
      actionsState: ACTIONS_STATE,
      deviceModelId: DeviceModelId.stax,
    });
  });

  it("fires once on the not-completed to completed transition", () => {
    setStepper({ areAllActionsCompleted: false, loading: false });
    const { rerender } = renderHook(() => usePostOnboardingCompletionTracking());
    expect(mockedTrack).not.toHaveBeenCalled();

    setStepper({ areAllActionsCompleted: true, loading: false });
    rerender({});

    expect(mockedTrack).toHaveBeenCalledTimes(1);
    expect(mockedTrack).toHaveBeenCalledWith("Post-onboarding widget completed", {
      deviceModelId: DeviceModelId.stax,
      flow: "post-onboarding",
    });
  });

  it("does not fire when already completed on mount (returning user)", () => {
    setStepper({ areAllActionsCompleted: true, loading: false });
    const { rerender } = renderHook(() => usePostOnboardingCompletionTracking());
    rerender({});
    expect(mockedTrack).not.toHaveBeenCalled();
  });

  it("ignores the transient loading phase and does not re-arm on it", () => {
    setStepper({ areAllActionsCompleted: false, loading: false });
    const { rerender } = renderHook(() => usePostOnboardingCompletionTracking());

    // Completion resolution flickers through a loading=true phase.
    setStepper({ areAllActionsCompleted: false, loading: true });
    rerender({});
    setStepper({ areAllActionsCompleted: true, loading: false });
    rerender({});

    expect(mockedTrack).toHaveBeenCalledTimes(1);
  });

  it("does not fire again while staying completed across re-renders", () => {
    setStepper({ areAllActionsCompleted: false, loading: false });
    const { rerender } = renderHook(() => usePostOnboardingCompletionTracking());
    setStepper({ areAllActionsCompleted: true, loading: false });
    rerender({});
    rerender({});
    rerender({});
    expect(mockedTrack).toHaveBeenCalledTimes(1);
  });

  it("re-arms when genuinely returning to not-completed, then fires again", () => {
    setStepper({ areAllActionsCompleted: false, loading: false });
    const { rerender } = renderHook(() => usePostOnboardingCompletionTracking());

    setStepper({ areAllActionsCompleted: true, loading: false });
    rerender({});
    expect(mockedTrack).toHaveBeenCalledTimes(1);

    // e.g. a new device's actions get loaded -> not completed again
    setStepper({ areAllActionsCompleted: false, loading: false });
    rerender({});
    setStepper({ areAllActionsCompleted: true, loading: false });
    rerender({});
    expect(mockedTrack).toHaveBeenCalledTimes(2);
  });

  it("waits for a device model id before firing", () => {
    mockedHubState.mockReturnValue({ actionsState: ACTIONS_STATE, deviceModelId: null });
    setStepper({ areAllActionsCompleted: false, loading: false });
    const { rerender } = renderHook(() => usePostOnboardingCompletionTracking());

    setStepper({ areAllActionsCompleted: true, loading: false });
    rerender({});
    expect(mockedTrack).not.toHaveBeenCalled();

    mockedHubState.mockReturnValue({
      actionsState: ACTIONS_STATE,
      deviceModelId: DeviceModelId.stax,
    });
    rerender({});
    expect(mockedTrack).toHaveBeenCalledTimes(1);
  });

  it("does not fire for a returning user whose actionsState starts empty then loads already-completed", () => {
    // actionsState is briefly empty while getPostOnboardingAction resolves.
    // With loading=false and no actions, areAllActionsCompleted is false.
    mockedHubState.mockReturnValue({ actionsState: [], deviceModelId: DeviceModelId.stax });
    setStepper({ areAllActionsCompleted: false, loading: false });
    const { rerender } = renderHook(() => usePostOnboardingCompletionTracking());
    expect(mockedTrack).not.toHaveBeenCalled();

    // Actions load, already completed -> must NOT be seen as a fresh completion.
    mockedHubState.mockReturnValue({
      actionsState: ACTIONS_STATE,
      deviceModelId: DeviceModelId.stax,
    });
    setStepper({ areAllActionsCompleted: true, loading: false });
    rerender({});
    expect(mockedTrack).not.toHaveBeenCalled();
  });
});
