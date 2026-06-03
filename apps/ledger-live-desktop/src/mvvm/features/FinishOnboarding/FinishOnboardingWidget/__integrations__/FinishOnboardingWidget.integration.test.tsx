import React from "react";
import { useNavigate } from "react-router";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, type PostOnboardingState } from "@ledgerhq/types-live";
import { initialState as postOnboardingInitialState } from "@ledgerhq/live-common/postOnboarding/reducer";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import PostOnboardingProviderWrapped from "~/renderer/components/PostOnboardingHub/logic/PostOnboardingProviderWrapped";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import FinishOnboardingDialog from "LLD/features/FinishOnboarding/FinishOnboardingDialog";
import FinishOnboardingWidget from "LLD/features/FinishOnboarding/FinishOnboardingWidget";
import { ProductTourDialog, useProductTourDialogViewModel } from "LLD/features/ProductTour/Drawer";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

/** Real `electron-store` is not usable in Jest. */
jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
}));

const mockedUseNavigate = jest.mocked(useNavigate);

function ProductTourDialogHarness() {
  const productTourDialogViewModel = useProductTourDialogViewModel();

  return <ProductTourDialog {...productTourDialogViewModel} />;
}

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
  return render(
    <PostOnboardingProviderWrapped>
      <FinishOnboardingWidget />
      <FinishOnboardingDialog />
    </PostOnboardingProviderWrapped>,
    { initialState },
  );
}

function renderDiscoverWalletPostOnboarding() {
  return render(
    <PostOnboardingProviderWrapped>
      <FinishOnboardingWidget />
      <FinishOnboardingDialog />
      <ProductTourDialogHarness />
    </PostOnboardingProviderWrapped>,
    {
      initialState: {
        postOnboarding: postOnboardingActiveState({
          actionsToComplete: [PostOnboardingActionId.discoverWallet],
          actionsCompleted: {
            [PostOnboardingActionId.discoverWallet]: false,
          },
          lastActionCompleted: null,
        }),
        settings: {
          ...AFTER_ONBOARDING_STATE,
          hasSeenWalletV4Tour: true,
          productTourCompleted: false,
        },
        ...withFlagOverrides({
          analyticsOptIn: {
            enabled: false,
          },
          lwdProductTour: {
            enabled: true,
          },
        }),
      },
    },
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
    await user.click(screen.getByRole("button", { name: /Personalize my Ledger/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("opens the Product Tour dialog when the discover wallet row is activated from the finish-onboarding dialog", async () => {
    const { user } = renderDiscoverWalletPostOnboarding();

    await user.click(screen.getByRole("button", { name: /Next, finish wallet setup/i }));
    expect(await screen.findByRole("dialog")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /Discover what your wallet can do/i }));

    expect(await screen.findByRole("button", { name: "Fund your wallet" })).toBeVisible();
  });
});
