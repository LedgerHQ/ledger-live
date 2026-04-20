import React from "react";
import { render, screen, waitFor } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import {
  assetsTransferAction,
  buyCryptoAction,
  recoverAction,
  syncAccountsAction,
} from "~/logic/postOnboarding/actions";
import type { State } from "~/reducers/types";
import { PostOnboardingHubDrawerWrapper } from "../PostOnboardingHubDrawerWrapper";

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index", () => ({
  usePostOnboardingHubState: jest.fn(),
}));

jest.mock("LLM/features/WalletSync/screens/Activation/ActivationDrawer", () => ({
  __esModule: true,
  default: () => null,
}));

const mockedUsePostOnboardingHubState = jest.mocked(usePostOnboardingHubState);

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
  });

  it("should render the device step with the drawer title and no action rows when no actions exist", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<PostOnboardingHubDrawerWrapper />, {
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
        { ...buyCryptoAction, completed: false },
      ],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<PostOnboardingHubDrawerWrapper />, {
      overrideInitialState: openedDrawerState,
    });

    await waitFor(() => {
      expect(screen.getByText("Add crypto")).toBeVisible();
    });
    expect(screen.getByText("Buy crypto via Ledger Wallet")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Got it/i })).toBeNull();
  });

  it("should show the completed title and the 'Got it' button when all actions are completed", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [
        { ...assetsTransferAction, completed: true },
        { ...buyCryptoAction, completed: true },
      ],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<PostOnboardingHubDrawerWrapper />, {
      overrideInitialState: openedDrawerState,
    });

    await waitFor(() => {
      expect(screen.getByText("Assets transferred to Ledger")).toBeVisible();
    });
    expect(screen.getByText(/all set/i)).toBeVisible();
    expect(screen.getByText("Crypto bought")).toBeVisible();
    expect(screen.getByRole("button", { name: /Got it/i })).toBeVisible();
  });

  it("should show the 'Got it' button when remaining actions are disabled", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [
        { ...assetsTransferAction, completed: true },
        { ...buyCryptoAction, completed: false, disabled: true },
      ],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<PostOnboardingHubDrawerWrapper />, {
      overrideInitialState: openedDrawerState,
    });

    await waitFor(() => {
      expect(screen.getByText("Assets transferred to Ledger")).toBeVisible();
    });
    expect(screen.getByText("Buy crypto via Ledger Wallet")).toBeVisible();
    expect(screen.getByRole("button", { name: /Got it/i })).toBeVisible();
  });

  it("should show a disabled pending row when an action feature is disabled", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [{ ...buyCryptoAction, completed: false, disabled: true }],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    render(<PostOnboardingHubDrawerWrapper />, {
      overrideInitialState: openedDrawerState,
    });

    const buyCryptoRow = await screen.findByRole("button", {
      name: /buy crypto via ledger wallet/i,
    });

    expect(buyCryptoRow).toBeDisabled();
    expect(screen.getByText("Choose from 500+ coins and tokens.")).toBeVisible();
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

    render(<PostOnboardingHubDrawerWrapper />, {
      overrideInitialState: openedDrawerWithLedgerSyncState,
    });

    await waitFor(() => {
      expect(screen.getByText("Your accounts are synchronized")).toBeVisible();
    });
    expect(screen.getByRole("button", { name: /Got it/i })).toBeVisible();
  });

  it("renders the Recover row and treats it as completed when async getIsAlreadyCompleted resolves true", async () => {
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

    render(<PostOnboardingHubDrawerWrapper />, {
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
        { ...buyCryptoAction, completed: true },
      ],
      lastActionCompleted: null,
      postOnboardingInProgress: true,
    });

    const { user, store } = render(<PostOnboardingHubDrawerWrapper />, {
      overrideInitialState: openedDrawerWithPostOnboardingInProgressState,
    });

    const gotItButton = await waitFor(() => screen.getByRole("button", { name: /Got it/i }));
    await user.press(gotItButton);

    expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(false);
    expect(store.getState().postOnboardingHubDrawer.isOpen).toBe(false);
  });
});
