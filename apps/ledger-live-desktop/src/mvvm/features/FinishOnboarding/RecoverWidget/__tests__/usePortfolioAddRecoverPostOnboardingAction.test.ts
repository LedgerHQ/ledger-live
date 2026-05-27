import React from "react";
import { PostOnboardingProvider } from "@ledgerhq/live-common/postOnboarding/PostOnboardingProvider";
import { useFeature } from "@features/platform-feature-flags";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingAction, PostOnboardingActionId } from "@ledgerhq/types-live";
import { render, waitFor } from "tests/testSetup";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { usePortfolioAddRecoverPostOnboardingAction } from "../usePortfolioAddRecoverPostOnboardingAction";

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));
jest.mock("@features/platform-feature-flags", () => ({
  ...jest.requireActual("@features/platform-feature-flags"),
  useFeature: jest.fn(),
  useWalletFeaturesConfig: () => ({ shouldDisplayFinishOnboardingWidget: true }),
}));
jest.mock("@ledgerhq/live-common/hooks/recoverFeatureFlag", () => ({
  useUpsellPath: () => "/protect/upsell",
}));
jest.mock(
  "~/renderer/components/PostOnboardingHub/logic/usePostOnboardingHubStepperDisplay",
  () => ({
    usePostOnboardingHubStepperDisplay: () => ({ areAllActionsCompleted: false, loading: false }),
  }),
);

const PROTECT_ID = "protect-prod";
const IN_PROGRESS = LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE;

const makeAction = (id: PostOnboardingActionId): PostOnboardingAction => ({
  id,
  Icon: () => null,
  title: "title",
  titleCompleted: "titleCompleted",
  startAction: jest.fn(),
});

const assetsTransfer = makeAction(PostOnboardingActionId.assetsTransfer);
const recover = makeAction(PostOnboardingActionId.recover);

type SetupArgs = {
  subscriptionState?: LedgerRecoverSubscriptionStateEnum;
  actions?: PostOnboardingAction[];
};

function setup({
  subscriptionState = LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
  actions = [assetsTransfer],
}: SetupArgs = {}) {
  jest.mocked(useFeature).mockImplementation(key => {
    if (key === "protectServicesDesktop") {
      return { enabled: true, params: { protectId: PROTECT_ID } };
    }
    return null;
  });

  const actionsById = Object.fromEntries(actions.map(a => [a.id, a]));
  const Consumer = () => {
    usePortfolioAddRecoverPostOnboardingAction();
    return null;
  };

  return render(
    React.createElement(
      PostOnboardingProvider,
      {
        navigateToPostOnboardingHub: jest.fn(),
        getPostOnboardingActionsForDevice: () => [],
        getPostOnboardingAction: (id: PostOnboardingActionId) => actionsById[id],
      },
      React.createElement(Consumer),
    ),
    {
      initialState: {
        postOnboarding: {
          deviceModelId: DeviceModelId.stax,
          walletEntryPointDismissed: false,
          entryPointFirstDisplayedDate: null,
          walletEntryPointEligibleForPortfolio: null,
          actionsToComplete: actions.map(a => a.id),
          actionsCompleted: Object.fromEntries(actions.map(a => [a.id, false])),
          lastActionCompleted: null,
          postOnboardingInProgress: true,
        },
        recoverState: {
          protectIdState: {
            [PROTECT_ID]: { subscriptionState, displayBanner: true },
          },
        },
      },
    },
  );
}

const recoverAdded = (store: ReturnType<typeof setup>["store"]) =>
  store.getState().postOnboarding.actionsToComplete.includes(PostOnboardingActionId.recover);

describe("usePortfolioAddRecoverPostOnboardingAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([IN_PROGRESS, LedgerRecoverSubscriptionStateEnum.BACKUP_DONE])(
    "dispatches recover for subscription state %s",
    async subscriptionState => {
      const { store } = setup({ subscriptionState });
      await waitFor(() => expect(recoverAdded(store)).toBe(true));
    },
  );

  it("does not append a duplicate when recover already exists", async () => {
    const { store } = setup({ subscriptionState: IN_PROGRESS, actions: [assetsTransfer, recover] });
    await waitFor(() =>
      expect(
        store
          .getState()
          .postOnboarding.actionsToComplete.filter(id => id === PostOnboardingActionId.recover),
      ).toHaveLength(1),
    );
  });
});
