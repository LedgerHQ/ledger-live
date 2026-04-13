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
import FinishOnboardingWidget from "..";

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
}));

jest.mock("@braze/web-sdk", () => ({}));

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

  it("navigates to the post-onboarding hub and tracks when the widget is activated", async () => {
    const { user } = renderWithPostOnboarding({
      postOnboarding: postOnboardingActiveState(),
    });

    await user.click(screen.getByRole("button", { name: /Next, finish wallet setup/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/post-onboarding");
    });

    expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
      deviceModelId: DeviceModelId.nanoX,
      button: "Post onboarding widget",
      flow: "post-onboarding",
    });
  });

  it("dispatches hide wallet entry point when the banner close control is used", async () => {
    const store = createStore({
      state: { postOnboarding: postOnboardingActiveState() } as State,
      dbMiddleware,
    });
    const dispatchSpy = jest.spyOn(store, "dispatch");

    const { user } = render(
      <PostOnboardingProviderWrapped>
        <FinishOnboardingWidget />
      </PostOnboardingProviderWrapped>,
      { store },
    );

    await screen.findByText("Next, finish wallet setup");

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    const dismissButton = buttons.find(
      button => !/Next, finish wallet setup/i.test(button.textContent ?? ""),
    );
    expect(dismissButton).toBeDefined();
    await user.click(dismissButton!);

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "POST_ONBOARDING_HIDE_WALLET_ENTRY_POINT" }),
      );
    });
  });
});
