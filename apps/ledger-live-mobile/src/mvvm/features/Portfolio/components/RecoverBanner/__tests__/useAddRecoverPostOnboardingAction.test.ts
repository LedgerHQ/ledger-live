import React from "react";
import { render, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { PostOnboardingProvider } from "@ledgerhq/live-common/postOnboarding/PostOnboardingProvider";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingAction, PostOnboardingActionId } from "@ledgerhq/types-live";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import type { State } from "~/reducers/types";
import { useAddRecoverPostOnboardingAction } from "../useAddRecoverPostOnboardingAction";

const mockUsePostOnboardingHubStepperDisplay = jest.fn();
jest.mock("~/logic/postOnboarding/usePostOnboardingHubStepperDisplay", () => ({
  usePostOnboardingHubStepperDisplay: (...args: unknown[]) =>
    mockUsePostOnboardingHubStepperDisplay(...args),
}));

const makeAction = (id: PostOnboardingActionId): PostOnboardingAction => ({
  id,
  Icon: () => null,
  title: "title",
  titleCompleted: "titleCompleted",
  startAction: jest.fn(),
});

const assetsTransferAction = makeAction(PostOnboardingActionId.assetsTransfer);
const recoverAction = makeAction(PostOnboardingActionId.recover);

const withPostOnboardingWidgetEnabled = withFlagOverrides({
  lwmWallet40: { enabled: true, params: { onboardingWidget: true } },
});

type TestHookProps = {
  readonly subscriptionState?: LedgerRecoverSubscriptionStateEnum;
  readonly actionsById?: Partial<Record<PostOnboardingActionId, PostOnboardingAction>>;
};

function TestHookConsumer({
  subscriptionState = LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
}: Pick<TestHookProps, "subscriptionState">) {
  useAddRecoverPostOnboardingAction(subscriptionState);

  return null;
}

function TestHook({
  subscriptionState = LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
  actionsById = { [PostOnboardingActionId.assetsTransfer]: assetsTransferAction },
}: TestHookProps) {
  return React.createElement(
    PostOnboardingProvider,
    {
      navigateToPostOnboardingHub: jest.fn(),
      getPostOnboardingActionsForDevice: () => [],
      getPostOnboardingAction: (actionId: PostOnboardingActionId) => actionsById[actionId],
    },
    React.createElement(TestHookConsumer, { subscriptionState }),
  );
}

function withPostOnboardingActions(
  actionsCompleted: State["postOnboarding"]["actionsCompleted"],
  baseTransform: (state: State) => State = withPostOnboardingWidgetEnabled,
) {
  const actionsToComplete = Object.values(PostOnboardingActionId).filter(
    actionId => actionsCompleted[actionId] !== undefined,
  );

  return (state: State): State => {
    const baseState = baseTransform(state);

    return {
      ...baseState,
      postOnboarding: {
        ...baseState.postOnboarding,
        deviceModelId: DeviceModelId.nanoX,
        actionsToComplete,
        actionsCompleted,
      },
    };
  };
}

const expectRecoverAction = (store: ReturnType<typeof render>["store"], expected: boolean) => {
  expect(
    store.getState().postOnboarding.actionsToComplete.includes(PostOnboardingActionId.recover),
  ).toBe(expected);
};

describe("useAddRecoverPostOnboardingAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePostOnboardingHubStepperDisplay.mockReturnValue({
      areAllActionsCompleted: false,
      loading: false,
    });
  });

  it("should dispatch recover action when existing post-onboarding actions are incomplete", async () => {
    const { store } = render(React.createElement(TestHook), {
      overrideInitialState: withPostOnboardingActions({
        [PostOnboardingActionId.assetsTransfer]: false,
      }),
    });

    await waitFor(() => expectRecoverAction(store, true));
  });

  it("should dispatch recover action when recover backup is done and existing actions are incomplete", async () => {
    const { store } = render(
      React.createElement(TestHook, {
        subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
      }),
      {
        overrideInitialState: withPostOnboardingActions({
          [PostOnboardingActionId.assetsTransfer]: false,
        }),
      },
    );

    await waitFor(() => expectRecoverAction(store, true));
  });

  it("should not dispatch recover action when existing post-onboarding actions are completed", () => {
    mockUsePostOnboardingHubStepperDisplay.mockReturnValue({
      areAllActionsCompleted: true,
      loading: false,
    });

    const { store } = render(
      React.createElement(TestHook, {
        actionsById: { [PostOnboardingActionId.assetsTransfer]: assetsTransferAction },
      }),
      {
        overrideInitialState: withPostOnboardingActions({
          [PostOnboardingActionId.assetsTransfer]: true,
        }),
      },
    );

    expectRecoverAction(store, false);
  });

  it("should not dispatch recover action while post-onboarding completion is loading", () => {
    mockUsePostOnboardingHubStepperDisplay.mockReturnValue({
      areAllActionsCompleted: false,
      loading: true,
    });

    const { store } = render(React.createElement(TestHook), {
      overrideInitialState: withPostOnboardingActions({
        [PostOnboardingActionId.assetsTransfer]: false,
      }),
    });

    expectRecoverAction(store, false);
  });

  it("should not dispatch recover action when mobile post-onboarding widget is disabled", async () => {
    const { store } = render(React.createElement(TestHook), {
      overrideInitialState: withPostOnboardingActions(
        { [PostOnboardingActionId.assetsTransfer]: false },
        withFlagOverrides({
          lwmWallet40: { enabled: true, params: { onboardingWidget: false } },
        }),
      ),
    });

    await waitFor(() => expectRecoverAction(store, false));
  });

  it("should not dispatch recover action when recover action already exists", () => {
    const { store } = render(
      React.createElement(TestHook, {
        actionsById: {
          [PostOnboardingActionId.assetsTransfer]: assetsTransferAction,
          [PostOnboardingActionId.recover]: recoverAction,
        },
      }),
      {
        overrideInitialState: withPostOnboardingActions({
          [PostOnboardingActionId.assetsTransfer]: false,
          [PostOnboardingActionId.recover]: false,
        }),
      },
    );

    expect(
      store
        .getState()
        .postOnboarding.actionsToComplete.filter(
          actionId => actionId === PostOnboardingActionId.recover,
        ),
    ).toHaveLength(1);
  });
});
