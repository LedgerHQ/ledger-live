import React from "react";
import { useNavigate } from "react-router";
import { initialState as postOnboardingInitialState } from "@ledgerhq/live-common/postOnboarding/reducer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, type PostOnboardingState } from "@ledgerhq/types-live";
import { render, screen } from "tests/testSetup";
import PostOnboardingProviderWrapped from "~/renderer/components/PostOnboardingHub/logic/PostOnboardingProviderWrapped";
import dbMiddleware from "~/renderer/middlewares/db";
import type { State } from "~/renderer/reducers";
import createStore from "~/state-manager/configureStore";
import FinishOnboardingDialog from "LLD/features/FinishOnboarding/FinishOnboardingDialog";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

/** Real `electron-store` is not usable in Jest. */
jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
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

function renderWithStore(
  reduxState: { postOnboarding: PostOnboardingState } & Pick<State, "dialogs">,
) {
  const store = createStore({
    state: {
      postOnboarding: reduxState.postOnboarding,
      dialogs: reduxState.dialogs,
    } as State,
    dbMiddleware,
  });
  return render(
    <PostOnboardingProviderWrapped>
      <FinishOnboardingDialog />
    </PostOnboardingProviderWrapped>,
    { store },
  );
}

describe("FinishOnboardingDialog integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  it("should not show dialog content when FINISH_POST_ONBOARDING is closed", () => {
    renderWithStore({
      postOnboarding: postOnboardingActiveState(),
      dialogs: {},
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should show the finish-setup dialog with title, stepper, and device row when open", async () => {
    renderWithStore({
      postOnboarding: postOnboardingActiveState(),
      dialogs: { FINISH_POST_ONBOARDING: true },
    });

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeVisible();
    expect(screen.getByText("Next, finish wallet setup")).toBeVisible();
    expect(screen.getByText("2/3")).toBeInTheDocument();
    expect(screen.getByText("Set up your Ledger")).toBeInTheDocument();
  });
});
