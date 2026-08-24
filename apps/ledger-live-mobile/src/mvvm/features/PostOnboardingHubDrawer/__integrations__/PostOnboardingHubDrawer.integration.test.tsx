import React from "react";
import { Platform } from "react-native";
import { render, screen, waitFor } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import type { QueuedBottomSheetProps } from "@shared/ui-queued-bottom-sheet";
import {
  assetsTransferAction,
  recoverAction,
  syncAccountsAction,
} from "~/logic/postOnboarding/actions";
import type { State } from "~/reducers/types";
import { PostOnboardingHubDrawerWrapper } from "../PostOnboardingHubDrawerWrapper";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";

let mockDrawerProps: QueuedBottomSheetProps | undefined;
const originalPlatform = Platform.OS;

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index", () => ({
  usePostOnboardingHubState: jest.fn(),
}));

jest.mock("LLM/features/WalletSync/screens/Activation/ActivationDrawer", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  const React = jest.requireActual<typeof import("react")>("react");

  function MockQueuedBottomSheet(props: QueuedBottomSheetProps) {
    mockDrawerProps = props;
    return React.createElement(actual.QueuedBottomSheet, props);
  }

  return {
    ...actual,
    QueuedBottomSheet: MockQueuedBottomSheet,
  };
});

const mockedUsePostOnboardingHubState = jest.mocked(usePostOnboardingHubState);

function HubDrawer() {
  return (
    <NotificationsPromptProvider>
      <PostOnboardingHubDrawerWrapper />
    </NotificationsPromptProvider>
  );
}

function openedDrawerState(state: State): State {
  return {
    ...state,
    postOnboardingHubDrawer: { isOpen: true },
  };
}

function openedDrawerWithPostOnboardingInProgressState(state: State): State {
  return {
    ...openedDrawerState(state),
    postOnboarding: {
      ...state.postOnboarding,
      postOnboardingInProgress: true,
    },
  };
}

function openedDrawerWithLedgerSyncState(state: State): State {
  return {
    ...openedDrawerState(state),
    trustchain: {
      ...state.trustchain,
      trustchain: {
        rootId: "rootId",
        applicationPath: "applicationPath",
        walletSyncEncryptionKey: "walletSyncEncryptionKey",
      },
    },
  };
}

describe("PostOnboardingHubDrawer Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDrawerProps = undefined;
  });

  afterEach(() => {
    Platform.OS = originalPlatform;
  });

  it("should render the device step with the drawer title and no action rows when no actions exist", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<HubDrawer />, {
      overrideInitialState: openedDrawerState,
    });

    await waitFor(() => {
      expect(screen.getByText("Next, finish wallet setup")).toBeVisible();
    });
    expect(screen.getByText("Set up your Ledger")).toBeVisible();
    expect(screen.queryByText("Add crypto")).toBeNull();
    expect(screen.queryByRole("button", { name: /Got it/i })).toBeNull();
  });

  it("should render each pending action when the hub has actions to complete", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [
        { ...assetsTransferAction, completed: false },
        { ...recoverAction, completed: false },
      ],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<HubDrawer />, {
      overrideInitialState: openedDrawerState,
    });

    await waitFor(() => {
      expect(screen.getByText("Add crypto")).toBeVisible();
    });
    expect(screen.getByText("Finish securing your backup")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Got it/i })).toBeNull();
  });

  it("should show the completed title and the 'Got it' button when all actions are completed", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [
        { ...assetsTransferAction, completed: true },
        { ...recoverAction, completed: true },
      ],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<HubDrawer />, {
      overrideInitialState: openedDrawerState,
    });

    await waitFor(() => {
      expect(screen.getByText("Assets transferred to Ledger")).toBeVisible();
    });
    expect(screen.getByText(/all set/i)).toBeVisible();
    expect(screen.getByText("Backup secured")).toBeVisible();
    expect(screen.getByRole("button", { name: /Got it/i })).toBeVisible();
  });

  it("should show the 'Got it' button when remaining actions are disabled", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [
        { ...assetsTransferAction, completed: true },
        { ...recoverAction, completed: false, disabled: true },
      ],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<HubDrawer />, {
      overrideInitialState: openedDrawerState,
    });

    await waitFor(() => {
      expect(screen.getByText("Assets transferred to Ledger")).toBeVisible();
    });
    expect(screen.getByText("Finish securing your backup")).toBeVisible();
    expect(screen.getByRole("button", { name: /Got it/i })).toBeVisible();
  });

  it("should show a disabled pending row when an action feature is disabled", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [{ ...syncAccountsAction, completed: false, disabled: true }],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<HubDrawer />, {
      overrideInitialState: openedDrawerState,
    });

    const syncRow = await screen.findByRole("button", {
      name: /sync your wallet/i,
    });

    expect(syncRow).toBeDisabled();
    expect(screen.getByText("Keep your crypto accounts synced")).toBeVisible();
  });

  it("should treat Ledger Sync as completed when sync is already active", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [
        { ...assetsTransferAction, completed: true },
        { ...syncAccountsAction, completed: false },
      ],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<HubDrawer />, {
      overrideInitialState: openedDrawerWithLedgerSyncState,
    });

    await waitFor(() => {
      expect(screen.getByText("Your accounts are synchronized")).toBeVisible();
    });
    expect(screen.getByRole("button", { name: /Got it/i })).toBeVisible();
  });

  it("should treat the Recover row as completed when getIsAlreadyCompleted resolves true", async () => {
    const getIsAlreadyCompleted = jest.fn(async () => true);

    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [
        { ...assetsTransferAction, completed: true },
        {
          ...recoverAction,
          completed: false,
          getIsAlreadyCompleted,
        },
      ],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<HubDrawer />, {
      overrideInitialState: openedDrawerState,
    });

    await waitFor(() => {
      expect(screen.getByText("Backup secured")).toBeVisible();
    });
    expect(screen.getByRole("button", { name: /Got it/i })).toBeVisible();
    expect(getIsAlreadyCompleted).toHaveBeenCalledTimes(1);
  });

  it("should complete post-onboarding and close the drawer when 'Got it' is pressed", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [
        { ...assetsTransferAction, completed: true },
        { ...recoverAction, completed: true },
      ],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    const { user, store } = render(<HubDrawer />, {
      overrideInitialState: openedDrawerWithPostOnboardingInProgressState,
    });

    const gotItButton = await waitFor(() => screen.getByRole("button", { name: /Got it/i }));
    await user.press(gotItButton);

    expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(false);
    expect(store.getState().postOnboardingHubDrawer.isOpen).toBe(false);
  });

  it("should size the sheet to its content when the hub drawer opens", async () => {
    Platform.OS = "ios";
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [{ ...assetsTransferAction, completed: false }],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<HubDrawer />, {
      overrideInitialState: openedDrawerState,
    });

    await waitFor(() => {
      expect(screen.getByText("Add crypto")).toBeVisible();
    });
    expect(mockDrawerProps?.enableDynamicSizing).toBe(true);
    expect(mockDrawerProps?.maxDynamicContentSize).toBe("fullWithOffset");
  });

  it("should leave dynamic content size unconstrained on Android", async () => {
    Platform.OS = "android";
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [{ ...assetsTransferAction, completed: false }],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<HubDrawer />, {
      overrideInitialState: openedDrawerState,
    });

    await waitFor(() => {
      expect(screen.getByText("Add crypto")).toBeVisible();
    });
    expect(mockDrawerProps?.maxDynamicContentSize).toBeUndefined();
  });

  it("should keep 24px of padding below the last hub row", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [{ ...assetsTransferAction, completed: false }],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<HubDrawer />, {
      overrideInitialState: openedDrawerState,
    });

    await waitFor(() => {
      expect(screen.getByText("Add crypto")).toBeVisible();
    });
    expect(screen.UNSAFE_getByType(BottomSheetView).props.style).toEqual(
      expect.objectContaining({ paddingBottom: 24 }),
    );
  });

  it("should close the hub with a 56px safe row while actions remain", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [{ ...assetsTransferAction, completed: false }],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<HubDrawer />, {
      overrideInitialState: openedDrawerState,
    });

    await waitFor(() => {
      expect(screen.getByText("Add crypto")).toBeVisible();
    });
    expect(screen.getByTestId("post-onboarding-hub-safe-row").props.style).toEqual(
      expect.objectContaining({ height: 56 }),
    );
  });

  it("should replace the safe row with the 'Got it' button once every action is completed", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [{ ...assetsTransferAction, completed: true }],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<HubDrawer />, {
      overrideInitialState: openedDrawerState,
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Got it/i })).toBeVisible();
    });
    expect(screen.queryByTestId("post-onboarding-hub-safe-row")).toBeNull();
  });
});
