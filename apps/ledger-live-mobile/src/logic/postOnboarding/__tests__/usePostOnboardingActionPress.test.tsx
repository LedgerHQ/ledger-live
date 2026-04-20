import { renderHook, act, waitFor } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { type Account, PostOnboardingActionId } from "@ledgerhq/types-live";
import { usePostOnboardingActionPress } from "../usePostOnboardingActionPress";
import type { PostOnboardingActionRowProps } from "~/components/PostOnboarding/PostOnboardingActionRow.types";
import { useNavigation } from "@react-navigation/native";
import { track } from "~/analytics";
import { useCompleteActionCallback } from "../useCompleteAction";
import { usePostOnboardingActionHandlers } from "../usePostOnboardingActionHandlers";
import { usePostOnboardingHubCompletionContext } from "../usePostOnboardingHubCompletionContext";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(),
}));
jest.mock("../useCompleteAction", () => ({
  useCompleteActionCallback: jest.fn(),
}));
jest.mock("../usePostOnboardingActionHandlers", () => ({
  usePostOnboardingActionHandlers: jest.fn(),
}));
jest.mock("../usePostOnboardingHubCompletionContext", () => ({
  usePostOnboardingHubCompletionContext: jest.fn(),
}));

const mockedNavigation = jest.mocked(useNavigation);
const mockedCompleteAction = jest.mocked(useCompleteActionCallback);
const mockedHandlers = jest.mocked(usePostOnboardingActionHandlers);
const mockedTrack = jest.mocked(track);
const mockedCompletionContext = jest.mocked(usePostOnboardingHubCompletionContext);

const baseProps = (
  overrides: Partial<PostOnboardingActionRowProps> = {},
): PostOnboardingActionRowProps => ({
  id: PostOnboardingActionId.assetsTransfer,
  Icon: (() => null) as never,
  title: "title",
  titleCompleted: "titleCompleted",
  deviceModelId: DeviceModelId.nanoX,
  productName: "Nano X",
  completed: false,
  ...overrides,
});

describe("usePostOnboardingActionPress", () => {
  const navigate = jest.fn();
  const completeAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedNavigation.mockReturnValue({ navigate } as never);
    mockedCompleteAction.mockReturnValue(completeAction);
    mockedHandlers.mockReturnValue({});
    mockedCompletionContext.mockReturnValue({
      isLedgerSyncActive: false,
      accounts: [],
      protectId: "protect-prod",
    });
  });

  it("derives isActionCompleted from `completed`", async () => {
    const { result } = renderHook(() =>
      usePostOnboardingActionPress(baseProps({ completed: true })),
    );
    await waitFor(() => expect(result.current.isActionCompleted).toBe(true));
    expect(result.current.isPressDisabled).toBe(true);
  });

  it("derives isActionCompleted from getIsAlreadyCompletedByState", async () => {
    mockedCompletionContext.mockReturnValue({
      isLedgerSyncActive: true,
      accounts: [],
      protectId: "protect-prod",
    });
    const getIsAlreadyCompletedByState = jest.fn(
      (args: { isLedgerSyncActive?: boolean; accounts?: Account[] }) =>
        Boolean(args.isLedgerSyncActive),
    );
    const { result } = renderHook(() =>
      usePostOnboardingActionPress(
        baseProps({
          getIsAlreadyCompletedByState,
        }),
      ),
    );
    await waitFor(() => expect(result.current.isActionCompleted).toBe(true));
  });

  it("derives isActionCompleted from async getIsAlreadyCompleted (Recover parity)", async () => {
    const getIsAlreadyCompleted = jest.fn(async ({ protectId }: { protectId: string }) =>
      protectId === "protect-prod",
    );
    const { result } = renderHook(() =>
      usePostOnboardingActionPress(
        baseProps({
          id: PostOnboardingActionId.recover,
          getIsAlreadyCompleted,
        }),
      ),
    );
    await waitFor(() => expect(result.current.isActionCompleted).toBe(true));
  });

  it("flags isPressDisabled when feature-disabled", async () => {
    const { result } = renderHook(() => usePostOnboardingActionPress(baseProps({ disabled: true })));
    await waitFor(() => expect(result.current.isCompletionLoading).toBe(false));
    expect(result.current.isPressDisabled).toBe(true);
  });

  it("flags isPressDisabled while completion is still loading", () => {
    const { result } = renderHook(() => usePostOnboardingActionPress(baseProps()));
    expect(result.current.isCompletionLoading).toBe(true);
    expect(result.current.isPressDisabled).toBe(true);
  });

  it("invokes a custom handler when present", async () => {
    const customHandler = jest.fn();
    mockedHandlers.mockReturnValue({ [PostOnboardingActionId.assetsTransfer]: customHandler });
    const { result } = renderHook(() => usePostOnboardingActionPress(baseProps()));
    await waitFor(() => expect(result.current.isCompletionLoading).toBe(false));
    act(() => result.current.handlePress());
    expect(customHandler).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("navigates with getNavigationParams", async () => {
    const getNavigationParams = jest.fn(() => ["Route", { foo: "bar" }] as never);
    const { result } = renderHook(() =>
      usePostOnboardingActionPress(baseProps({ getNavigationParams })),
    );
    await waitFor(() => expect(result.current.isCompletionLoading).toBe(false));
    act(() => result.current.handlePress());
    expect(getNavigationParams).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("Route", { foo: "bar" });
  });

  it("calls startAction when present and tracks analytics", async () => {
    const startAction = jest.fn();
    const openActivationDrawer = jest.fn();
    const { result } = renderHook(() =>
      usePostOnboardingActionPress(
        baseProps({
          startAction,
          openActivationDrawer,
          buttonLabelForAnalyticsEvent: "Some label",
        }),
      ),
    );
    await waitFor(() => expect(result.current.isCompletionLoading).toBe(false));
    act(() => result.current.handlePress());
    expect(startAction).toHaveBeenCalledWith({ openActivationDrawer });
    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      button: "Some label",
      deviceModelId: DeviceModelId.nanoX,
      flow: "post-onboarding",
    });
  });

  it("completes the action when shouldCompleteOnStart is true", async () => {
    const { result } = renderHook(() =>
      usePostOnboardingActionPress(baseProps({ shouldCompleteOnStart: true })),
    );
    await waitFor(() => expect(result.current.isCompletionLoading).toBe(false));
    act(() => result.current.handlePress());
    expect(completeAction).toHaveBeenCalledWith(PostOnboardingActionId.assetsTransfer);
  });
});
