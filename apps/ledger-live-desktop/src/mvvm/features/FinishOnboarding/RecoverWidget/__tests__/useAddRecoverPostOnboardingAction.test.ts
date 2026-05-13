import React from "react";
import { PostOnboardingProvider } from "@ledgerhq/live-common/postOnboarding/PostOnboardingProvider";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingAction, PostOnboardingActionId } from "@ledgerhq/types-live";
import { render, waitFor, withFlagOverrides } from "tests/testSetup";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { useAddRecoverPostOnboardingAction } from "../useAddRecoverPostOnboardingAction";

const mockStepperDisplay = jest.fn();
jest.mock(
  "~/renderer/components/PostOnboardingHub/logic/usePostOnboardingHubStepperDisplay",
  () => ({
    usePostOnboardingHubStepperDisplay: () => mockStepperDisplay(),
  }),
);

const IN_PROGRESS = LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE;

const widgetEnabled = withFlagOverrides({
  lwdWallet40: { enabled: true, params: { finishOnboardingWidget: true } },
});

const widgetDisabled = withFlagOverrides({
  lwdWallet40: { enabled: true, params: { finishOnboardingWidget: false } },
});

const makeAction = (id: PostOnboardingActionId): PostOnboardingAction => ({
  id,
  Icon: () => null,
  title: "title",
  titleCompleted: "titleCompleted",
  startAction: jest.fn(),
});

const assetsTransferAction = makeAction(PostOnboardingActionId.assetsTransfer);
const recoverAction = makeAction(PostOnboardingActionId.recover);

function setup(args: {
  subscriptionState: LedgerRecoverSubscriptionStateEnum | undefined;
  actionsCompleted?: Partial<Record<PostOnboardingActionId, boolean>>;
  actionsById?: Partial<Record<PostOnboardingActionId, PostOnboardingAction>>;
  flags?: ReturnType<typeof withFlagOverrides>;
}) {
  const actionsCompleted = args.actionsCompleted ?? {
    [PostOnboardingActionId.assetsTransfer]: false,
  };
  const actionsById = args.actionsById ?? {
    [PostOnboardingActionId.assetsTransfer]: assetsTransferAction,
  };

  const Consumer = () => {
    useAddRecoverPostOnboardingAction(args.subscriptionState);
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
        ...(args.flags ?? widgetEnabled),
        postOnboarding: {
          deviceModelId: DeviceModelId.nanoX,
          walletEntryPointDismissed: false,
          entryPointFirstDisplayedDate: null,
          walletEntryPointEligibleForPortfolio: null,
          actionsToComplete: Object.values(PostOnboardingActionId).filter(
            id => actionsCompleted[id] !== undefined,
          ),
          actionsCompleted,
          lastActionCompleted: null,
          postOnboardingInProgress: true,
        },
      },
    },
  );
}

const hasRecover = (store: ReturnType<typeof setup>["store"]) =>
  store.getState().postOnboarding.actionsToComplete.includes(PostOnboardingActionId.recover);

describe("useAddRecoverPostOnboardingAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStepperDisplay.mockReturnValue({ areAllActionsCompleted: false, loading: false });
  });

  it("dispatches recover when in-progress subscription state lands while other actions remain incomplete", async () => {
    const { store } = setup({ subscriptionState: IN_PROGRESS });
    await waitFor(() => expect(hasRecover(store)).toBe(true));
  });

  it("dispatches recover when backup is done and other actions remain incomplete", async () => {
    const { store } = setup({ subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE });
    await waitFor(() => expect(hasRecover(store)).toBe(true));
  });

  it("does not dispatch when subscription state is undefined", () => {
    const { store } = setup({ subscriptionState: undefined });
    expect(hasRecover(store)).toBe(false);
  });

  it("does not dispatch on NO_SUBSCRIPTION", () => {
    const { store } = setup({
      subscriptionState: LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
    });
    expect(hasRecover(store)).toBe(false);
  });

  it("does not dispatch when all existing actions are already completed", () => {
    mockStepperDisplay.mockReturnValue({ areAllActionsCompleted: true, loading: false });
    const { store } = setup({
      subscriptionState: IN_PROGRESS,
      actionsCompleted: { [PostOnboardingActionId.assetsTransfer]: true },
    });
    expect(hasRecover(store)).toBe(false);
  });

  it("does not dispatch while async fulfillment checks are still loading", () => {
    mockStepperDisplay.mockReturnValue({ areAllActionsCompleted: false, loading: true });
    const { store } = setup({ subscriptionState: IN_PROGRESS });
    expect(hasRecover(store)).toBe(false);
  });

  it("does not dispatch when there are no post-onboarding actions to begin with", () => {
    const { store } = setup({ subscriptionState: IN_PROGRESS, actionsCompleted: {} });
    expect(hasRecover(store)).toBe(false);
  });

  it("does not dispatch when the finish-onboarding widget flag is disabled", () => {
    const { store } = setup({ subscriptionState: IN_PROGRESS, flags: widgetDisabled });
    expect(hasRecover(store)).toBe(false);
  });

  it("does not append a duplicate recover entry when it already exists", async () => {
    const { store } = setup({
      subscriptionState: IN_PROGRESS,
      actionsCompleted: {
        [PostOnboardingActionId.assetsTransfer]: false,
        [PostOnboardingActionId.recover]: false,
      },
      actionsById: {
        [PostOnboardingActionId.assetsTransfer]: assetsTransferAction,
        [PostOnboardingActionId.recover]: recoverAction,
      },
    });
    await waitFor(() =>
      expect(
        store
          .getState()
          .postOnboarding.actionsToComplete.filter(id => id === PostOnboardingActionId.recover),
      ).toHaveLength(1),
    );
  });
});
