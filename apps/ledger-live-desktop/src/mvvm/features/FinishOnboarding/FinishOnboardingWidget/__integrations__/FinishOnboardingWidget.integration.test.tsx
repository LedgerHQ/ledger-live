import React from "react";
import { useNavigate } from "react-router";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, type PostOnboardingState } from "@ledgerhq/types-live";
import { initialState as postOnboardingInitialState } from "@ledgerhq/live-common/postOnboarding/reducer";
import { render, screen, waitFor } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import PostOnboardingProviderWrapped from "~/renderer/components/PostOnboardingHub/logic/PostOnboardingProviderWrapped";
import dbMiddleware from "~/renderer/middlewares/db";
import type { State } from "~/renderer/reducers";
import createStore from "~/state-manager/configureStore";
import FinishOnboardingDialog from "LLD/features/FinishOnboarding/FinishOnboardingDialog";
import FinishOnboardingWidget from "LLD/features/FinishOnboarding/FinishOnboardingWidget";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

const mockedUseNavigate = jest.mocked(useNavigate);

function postOnboardingActiveState(
  overrides: Partial<PostOnboardingState> = {},
): PostOnboardingState {
  return {
    ...postOnboardingInitialState,
    deviceModelId: DeviceModelId.nanoX,
    walletEntryPointDismissed: false,
    entryPointFirstDisplayedDate: new Date("2024-06-01"),
    walletEntryPointEligibleForPortfolio: true,
    actionsToComplete: [PostOnboardingActionId.claimMock, PostOnboardingActionId.personalizeMock],
    actionsCompleted: {
      [PostOnboardingActionId.claimMock]: true,
      [PostOnboardingActionId.personalizeMock]: false,
    },
    lastActionCompleted: PostOnboardingActionId.claimMock,
    postOnboardingInProgress: true,
    ...overrides,
  };
}

function renderWithPostOnboarding(initialState: { postOnboarding: PostOnboardingState }) {
  const store = createStore({
    state: { postOnboarding: initialState.postOnboarding } as State,
    dbMiddleware,
  });
  return render(
    <PostOnboardingProviderWrapped>
      <FinishOnboardingWidget />
      <FinishOnboardingDialog />
    </PostOnboardingProviderWrapped>,
    { store },
  );
}

describe("FinishOnboardingWidget integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  it("renders nothing when post-onboarding is not in progress", () => {
    const { container } = renderWithPostOnboarding({
      postOnboarding: postOnboardingActiveState({ postOnboardingInProgress: false }),
    });

    expect(container.firstChild).toBeNull();
  });

  it("renders the widget copy and stepper when post-onboarding is in progress", async () => {
    renderWithPostOnboarding({
      postOnboarding: postOnboardingActiveState(),
    });

    expect(await screen.findByText("Next, finish wallet setup")).toBeInTheDocument();
    expect(screen.getByText("Start with funding your wallet.")).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
  });

  it("opens the finish-onboarding dialog and tracks when the widget is activated", async () => {
    const { user } = renderWithPostOnboarding({
      postOnboarding: postOnboardingActiveState(),
    });

    await user.click(screen.getByRole("button", { name: /Next, finish wallet setup/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();

    expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
      deviceModelId: DeviceModelId.nanoX,
      button: "Post onboarding widget",
      flow: "post-onboarding",
    });
  });

  it("closes the finish-onboarding dialog when a list row (post-onboarding action) is activated", async () => {
    const { user } = renderWithPostOnboarding({
      postOnboarding: postOnboardingActiveState(),
    });

    await user.click(screen.getByRole("button", { name: /Next, finish wallet setup/i }));
    await screen.findByRole("dialog");
    await user.click(
      screen.getByRole("button", { name: /Personalize my Ledger/i }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
