import { act, renderHook, waitFor } from "@tests/test-renderer";
import { InteractionManager } from "react-native";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { openPostOnboardingHubDrawer } from "~/reducers/postOnboardingHubDrawer";
import { usePostOnboardingHubDrawerViewModel } from "../hooks/usePostOnboardingHubDrawerViewModel";

const mockPresent = jest.fn();
const mockDismiss = jest.fn();

jest.mock("@ledgerhq/lumen-ui-rnative", () => ({
  ...jest.requireActual("@ledgerhq/lumen-ui-rnative"),
  useBottomSheetRef: () => ({ current: { present: mockPresent, dismiss: mockDismiss } }),
}));

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index", () => ({
  usePostOnboardingHubState: jest.fn(),
}));

const mockCompletePostOnboarding = jest.fn();
jest.mock("~/logic/postOnboarding/useCompletePostOnboarding", () => ({
  useCompletePostOnboarding: () => mockCompletePostOnboarding,
}));

const mockOpenActivationDrawer = jest.fn();
const mockCloseActivationDrawer = jest.fn();
jest.mock("LLM/features/LedgerSyncEntryPoint/useLedgerSyncEntryPointViewModel", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isActivationDrawerVisible: false,
    openActivationDrawer: mockOpenActivationDrawer,
    closeActivationDrawer: mockCloseActivationDrawer,
    page: "PostOnboarding",
    shouldDisplayEntryPoint: false,
    onClickEntryPoint: jest.fn(),
    entryPointComponent: null,
  })),
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
  let runAfterInteractionsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    runAfterInteractionsSpy = jest
      .spyOn(InteractionManager, "runAfterInteractions")
      .mockImplementation(task => {
        if (typeof task === "function") task();
        else if (task && "run" in task && typeof task.run === "function") task.run();
        return { cancel: jest.fn() } as never;
      });
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });
  });

  afterEach(() => {
    runAfterInteractionsSpy.mockRestore();
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

  it("should present the bottom sheet when drawer is opened through Redux", () => {
    const { store, rerender } = renderHook(() => usePostOnboardingHubDrawerViewModel());
    expect(mockPresent).not.toHaveBeenCalled();

    act(() => {
      store.dispatch(openPostOnboardingHubDrawer());
    });
    rerender({});

    expect(mockPresent).toHaveBeenCalled();
    expect(store.getState().settings.hasBeenRedirectedToPostOnboarding).toBe(true);
  });

  it("should close the drawer, complete post-onboarding and dismiss the sheet on onRequestExit", () => {
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
    expect(mockDismiss).toHaveBeenCalled();
  });
});
