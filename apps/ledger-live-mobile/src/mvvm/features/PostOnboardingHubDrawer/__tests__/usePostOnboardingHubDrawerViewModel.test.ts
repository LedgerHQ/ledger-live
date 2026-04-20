import { act, renderHook, waitFor } from "@tests/test-renderer";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { openPostOnboardingHubDrawer } from "~/reducers/postOnboardingHubDrawer";
import { usePostOnboardingHubDrawerViewModel } from "../hooks/usePostOnboardingHubDrawerViewModel";

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index", () => ({
  usePostOnboardingHubState: jest.fn(),
}));

const mockCompletePostOnboarding = jest.fn();
jest.mock("~/logic/postOnboarding/useCompletePostOnboarding", () => ({
  useCompletePostOnboarding: () => mockCompletePostOnboarding,
}));

const mockedUsePostOnboardingHubState = jest.mocked(usePostOnboardingHubState);

function makeAction(id: PostOnboardingActionId, completed = false, overrides = {}) {
  return {
    id,
    Icon: () => null,
    title: `title_${id}`,
    description: `desc_${id}`,
    tagLabel: undefined,
    featureFlagId: undefined,
    startAction: jest.fn(),
    completed,
    disabled: false,
    ...overrides,
  } as never;
}

describe("usePostOnboardingHubDrawerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });
  });

  it("should expose the device productName derived from the device model", () => {
    const { result } = renderHook(() => usePostOnboardingHubDrawerViewModel());
    expect(result.current.productName).toBe(getDeviceModel(DeviceModelId.stax).productName);
    expect(result.current.deviceModelId).toBe(DeviceModelId.stax);
  });

  it("should return an empty string productName when no device model is known", () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: null as unknown as DeviceModelId,
      actionsState: [],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });
    const { result } = renderHook(() => usePostOnboardingHubDrawerViewModel());
    expect(result.current.productName).toBe("");
  });

  it("should report actions as not fully completed when the list is empty", async () => {
    const { result } = renderHook(() => usePostOnboardingHubDrawerViewModel());
    await waitFor(() => expect(result.current.stepperDisplay.loading).toBe(false));
    expect(result.current.areAllPostOnboardingActionsCompleted).toBe(false);
  });

  it("should report actions as not fully completed while some remain", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [
        makeAction(PostOnboardingActionId.assetsTransfer, true),
        makeAction(PostOnboardingActionId.buyCrypto, false),
      ],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });
    const { result } = renderHook(() => usePostOnboardingHubDrawerViewModel());
    await waitFor(() => expect(result.current.stepperDisplay.loading).toBe(false));
    expect(result.current.areAllPostOnboardingActionsCompleted).toBe(false);
  });

  it("should report actions as fully completed when every action is completed or disabled", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [
        makeAction(PostOnboardingActionId.assetsTransfer, true),
        makeAction(PostOnboardingActionId.buyCrypto, false, { disabled: true }),
      ],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });
    const { result } = renderHook(() => usePostOnboardingHubDrawerViewModel());
    await waitFor(() => expect(result.current.stepperDisplay.loading).toBe(false));
    expect(result.current.areAllPostOnboardingActionsCompleted).toBe(true);
  });

  it("should report recover as completed when async getIsAlreadyCompleted resolves true", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [
        makeAction(PostOnboardingActionId.assetsTransfer, true),
        makeAction(PostOnboardingActionId.recover, false, {
          getIsAlreadyCompleted: async () => true,
        }),
      ],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });
    const { result } = renderHook(() => usePostOnboardingHubDrawerViewModel());
    await waitFor(() => expect(result.current.stepperDisplay.loading).toBe(false));
    expect(result.current.areAllPostOnboardingActionsCompleted).toBe(true);
  });

  it("should set onboarding redirect flag and open drawer state when hub is opened through Redux", () => {
    const { store, rerender, result } = renderHook(() => usePostOnboardingHubDrawerViewModel());
    expect(store.getState().postOnboardingHubDrawer.isOpen).toBe(false);

    act(() => {
      store.dispatch(openPostOnboardingHubDrawer());
    });
    rerender({});

    expect(store.getState().postOnboardingHubDrawer.isOpen).toBe(true);
    expect(store.getState().settings.hasBeenRedirectedToPostOnboarding).toBe(true);
    expect(result.current.isPostOnboardingHubDrawerOpen).toBe(true);
  });

  it("should close the drawer and complete post-onboarding on onRequestExit", () => {
    const { result, store } = renderHook(() => usePostOnboardingHubDrawerViewModel(), {
      overrideInitialState: state => ({
        ...state,
        postOnboardingHubDrawer: { isOpen: true },
      }),
    });

    act(() => {
      result.current.onRequestExit();
    });

    expect(store.getState().postOnboardingHubDrawer.isOpen).toBe(false);
    expect(mockCompletePostOnboarding).toHaveBeenCalledWith({ skipPortfolioNavigation: true });
  });
});
