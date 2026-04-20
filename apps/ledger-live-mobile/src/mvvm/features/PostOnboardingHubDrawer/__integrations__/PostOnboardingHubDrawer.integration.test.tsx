import React from "react";
import { render, screen, waitFor } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import {
  assetsTransferAction,
  buyCryptoAction,
  recoverAction,
} from "~/logic/postOnboarding/actions";
import { PostOnboardingHubDrawerWrapper } from "../PostOnboardingHubDrawerWrapper";

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index", () => ({
  usePostOnboardingHubState: jest.fn(),
}));

const mockCompletePostOnboarding = jest.fn();
jest.mock("~/logic/postOnboarding/useCompletePostOnboarding", () => ({
  useCompletePostOnboarding: () => mockCompletePostOnboarding,
}));

jest.mock("LLM/features/LedgerSyncEntryPoint/useLedgerSyncEntryPointViewModel", () => ({
  __esModule: true,
  default: () => ({
    isActivationDrawerVisible: false,
    openActivationDrawer: jest.fn(),
    closeActivationDrawer: jest.fn(),
    page: "PostOnboarding",
    shouldDisplayEntryPoint: false,
    onClickEntryPoint: jest.fn(),
    entryPointComponent: null,
  }),
}));

jest.mock("LLM/features/WalletSync/screens/Activation/ActivationDrawer", () => ({
  __esModule: true,
  default: () => null,
}));

const mockedUsePostOnboardingHubState = jest.mocked(usePostOnboardingHubState);

function openedDrawerState(state: ReturnType<typeof Object.assign>) {
  return {
    ...state,
    postOnboardingHubDrawer: { isOpen: true },
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
    expect(screen.getByText("Setup your Ledger device")).toBeVisible();
    expect(screen.queryByText("Transfer your assets")).toBeNull();
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
      expect(screen.getByText("Transfer your assets")).toBeVisible();
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
    expect(screen.getByText("Crypto bought")).toBeVisible();
    expect(screen.getByRole("button", { name: /Got it/i })).toBeVisible();
  });

  it("renders the Recover row and treats it as completed when async getIsAlreadyCompleted resolves true", async () => {
    mockedUsePostOnboardingHubState.mockReturnValue({
      deviceModelId: DeviceModelId.stax,
      actionsState: [
        { ...assetsTransferAction, completed: true },
        {
          ...recoverAction,
          completed: false,
          getIsAlreadyCompleted: async () => true,
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
      overrideInitialState: openedDrawerState,
    });

    const gotItButton = await waitFor(() => screen.getByRole("button", { name: /Got it/i }));
    await user.press(gotItButton);

    expect(mockCompletePostOnboarding).toHaveBeenCalledWith({ skipPortfolioNavigation: true });
    expect(store.getState().postOnboardingHubDrawer.isOpen).toBe(false);
  });
});
