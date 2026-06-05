import { sub } from "date-fns";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import type { Features } from "@shared/feature-flags";
import { AB_TESTING_VARIANTS, type ABTestingVariants } from "../../types/variants";
import {
  INACTIVITY_DRAWER_DELAY_MS,
  canPromptTransactionsAlertsForAction,
  evaluateAfterActionTrigger,
  evaluateInactivityTrigger,
  getNextRepromptDelay,
  getNotificationPromptTarget,
  shouldPromptOptInDrawerAfterAction,
} from "../notificationsPromptEngine";

type BrazePushNotifications = Features["brazePushNotifications"];
type BrazeNotificationsCategoryConfig = NonNullable<
  BrazePushNotifications["params"]
>["notificationsCategories"][number];
type LwmNewWordingOptInNotificationsDrawer = Features["lwmNewWordingOptInNotificationsDrawer"];

const transactionsAlertsCategoryConfig: BrazeNotificationsCategoryConfig = {
  displayed: true,
  category: "transactionsAlertsCategory",
  drawerPromptEnabled: true,
  drawerPromptActions: ["send", "receive", "swap"] as BrazeNotificationsCategoryConfig["drawerPromptActions"],
};

const defaultOptInState = {
  transactionsAlertsCategory: false as boolean | undefined,
};

const NOW = new Date("2026-01-01T00:00:00.000Z").getTime();

const defaultBrazePushNotificationsParams: NonNullable<BrazePushNotifications["params"]> = {
  reprompt_schedule: [{ days: 7, hours: 0, minutes: 0, months: 0, seconds: 0 }],
  action_events: {
    complete_onboarding: { enabled: true, timer: 100 },
    send: { enabled: true, timer: 200 },
    dapp_complete: { enabled: true, timer: 200 },
    receive: { enabled: true, timer: 300 },
    buy: { enabled: true, timer: 400 },
    swap: { enabled: true, timer: 500 },
    stake: { enabled: true, timer: 600 },
    add_favorite_coin: { enabled: true, timer: 700 },
  },
  inactivity_enabled: true,
  inactivity_reprompt: { days: 0, hours: 0, minutes: 0, months: 6, seconds: 0 },
  notificationsCategories: [],
};

const createBrazePushNotificationsFeature = (
  overrides?: Partial<Omit<BrazePushNotifications, "params">> & {
    params?: Partial<NonNullable<BrazePushNotifications["params"]>>;
  },
): BrazePushNotifications =>
  ({
    enabled: true,
    ...overrides,
    params: {
      ...defaultBrazePushNotificationsParams,
      ...overrides?.params,
    },
  }) as BrazePushNotifications;

const createBrazePushNotificationsWithTransactionsAlerts = () =>
  createBrazePushNotificationsFeature({
    params: {
      notificationsCategories: [transactionsAlertsCategoryConfig],
    },
  });

const createWordingFeature = (
  variant: ABTestingVariants = AB_TESTING_VARIANTS.B,
): LwmNewWordingOptInNotificationsDrawer =>
  ({
    enabled: true,
    params: { variant },
  }) as LwmNewWordingOptInNotificationsDrawer;

type EvaluationContext = {
  brazePushNotifications: BrazePushNotifications;
  wordingFeature: LwmNewWordingOptInNotificationsDrawer;
  isRatingsModalOpen: boolean;
  isDrawerPending: boolean;
  now: number;
};

const createEvaluationContext = ({
  brazePushNotifications = createBrazePushNotificationsFeature(),
  wordingFeature = createWordingFeature(),
  isRatingsModalOpen = false,
  isDrawerPending = false,
  now = NOW,
}: Partial<EvaluationContext> = {}): EvaluationContext => ({
  brazePushNotifications,
  wordingFeature,
  isRatingsModalOpen,
  isDrawerPending,
  now,
});

describe("notificationsPromptEngine", () => {
  describe("after-action decisions", () => {
    it("shows the drawer for an eligible first-time action", () => {
      const decision = evaluateAfterActionTrigger(
        {
          source: "send",
          permissionStatus: AuthorizationStatus.NOT_DETERMINED,
          areNotificationsAllowed: true,
          ...defaultOptInState,
          pushNotificationsDataOfUser: null,
        },
        createEvaluationContext(),
      );

      expect(decision).toEqual({
        kind: "show",
        source: "send",
        delayMs: 200,
        drawerPromptTarget: "globalPushNotifications",
        dismissedCount: 0,
        nextRepromptDelay: null,
        variant: AB_TESTING_VARIANTS.B,
      });
    });

    it("skips when the user is already fully opted in", () => {
      const decision = evaluateAfterActionTrigger(
        {
          source: "send",
          permissionStatus: AuthorizationStatus.AUTHORIZED,
          areNotificationsAllowed: true,
          transactionsAlertsCategory: true,
          pushNotificationsDataOfUser: null,
        },
        createEvaluationContext(),
      );

      expect(decision).toEqual({
        kind: "skip",
        source: "send",
        reason: "fully_opted_in",
        dismissedCount: 0,
        nextRepromptDelay: null,
        variant: AB_TESTING_VARIANTS.B,
      });
    });

    it("applies the reprompt schedule before showing again", () => {
      const pushNotificationsDataOfUser = {
        dismissedOptInDrawerAtList: [sub(NOW, { days: 1 }).getTime()],
      };

      const decision = evaluateAfterActionTrigger(
        {
          source: "send",
          permissionStatus: AuthorizationStatus.DENIED,
          areNotificationsAllowed: true,
          ...defaultOptInState,
          pushNotificationsDataOfUser,
        },
        createEvaluationContext(),
      );

      expect(decision).toEqual({
        kind: "skip",
        source: "send",
        reason: "reprompt_delay_not_reached",
        dismissedCount: 1,
        nextRepromptDelay: { days: 7, hours: 0, minutes: 0, months: 0, seconds: 0 },
        variant: AB_TESTING_VARIANTS.B,
      });
    });

    it("shows again once the reprompt delay is reached", () => {
      const pushNotificationsDataOfUser = {
        dismissedOptInDrawerAtList: [sub(NOW, { days: 8 }).getTime()],
      };

      const decision = evaluateAfterActionTrigger(
        {
          source: "send",
          permissionStatus: AuthorizationStatus.DENIED,
          areNotificationsAllowed: true,
          ...defaultOptInState,
          pushNotificationsDataOfUser,
        },
        createEvaluationContext(),
      );

      expect(decision).toEqual({
        kind: "show",
        source: "send",
        delayMs: 200,
        drawerPromptTarget: "globalPushNotifications",
        dismissedCount: 1,
        nextRepromptDelay: { days: 7, hours: 0, minutes: 0, months: 0, seconds: 0 },
        variant: AB_TESTING_VARIANTS.B,
      });
    });

    describe("reprompt eligibility", () => {
      it("skips global push when the reprompt delay has not been reached (per-target dismissals)", () => {
        const decision = evaluateAfterActionTrigger(
          {
            source: "send",
            permissionStatus: AuthorizationStatus.DENIED,
            areNotificationsAllowed: true,
            ...defaultOptInState,
            pushNotificationsDataOfUser: {
              dismissedPromptAtListByTarget: {
                globalPushNotifications: [sub(NOW, { days: 1 }).getTime()],
              },
            },
          },
          createEvaluationContext(),
        );

        expect(decision).toEqual({
          kind: "skip",
          source: "send",
          reason: "reprompt_delay_not_reached",
          dismissedCount: 1,
          nextRepromptDelay: { days: 7, hours: 0, minutes: 0, months: 0, seconds: 0 },
          variant: AB_TESTING_VARIANTS.B,
        });
      });

      it("skips when dismissals exist but no reprompt schedule is configured", () => {
        const decision = evaluateAfterActionTrigger(
          {
            source: "send",
            permissionStatus: AuthorizationStatus.DENIED,
            areNotificationsAllowed: true,
            ...defaultOptInState,
            pushNotificationsDataOfUser: {
              dismissedOptInDrawerAtList: [sub(NOW, { days: 8 }).getTime()],
            },
          },
          createEvaluationContext({
            brazePushNotifications: createBrazePushNotificationsFeature({
              params: { reprompt_schedule: [] },
            }),
          }),
        );

        expect(decision).toEqual({
          kind: "skip",
          source: "send",
          reason: "configuration_missing",
          dismissedCount: 1,
          nextRepromptDelay: null,
          variant: AB_TESTING_VARIANTS.B,
        });
      });
    });

    it("shows transactions alerts on first prompt when globally opted in", () => {
      const decision = evaluateAfterActionTrigger(
        {
          source: "receive",
          permissionStatus: AuthorizationStatus.AUTHORIZED,
          areNotificationsAllowed: true,
          transactionsAlertsCategory: false,
          pushNotificationsDataOfUser: null,
        },
        createEvaluationContext({
          brazePushNotifications: createBrazePushNotificationsWithTransactionsAlerts(),
        }),
      );

      expect(decision).toEqual({
        kind: "show",
        source: "receive",
        delayMs: 300,
        drawerPromptTarget: "transactionsAlertsCategory",
        dismissedCount: 0,
        nextRepromptDelay: null,
        variant: AB_TESTING_VARIANTS.B,
      });
    });

    it("shows transactions alerts when globally opted in and the action is eligible", () => {
      const pushNotificationsDataOfUser = {
        dismissedPromptAtListByTarget: {
          transactionsAlertsCategory: [sub(NOW, { days: 8 }).getTime()],
        },
      };

      const decision = evaluateAfterActionTrigger(
        {
          source: "send",
          permissionStatus: AuthorizationStatus.AUTHORIZED,
          areNotificationsAllowed: true,
          transactionsAlertsCategory: false,
          pushNotificationsDataOfUser,
        },
        createEvaluationContext({
          brazePushNotifications: createBrazePushNotificationsWithTransactionsAlerts(),
        }),
      );

      expect(decision).toEqual({
        kind: "show",
        source: "send",
        delayMs: 200,
        drawerPromptTarget: "transactionsAlertsCategory",
        dismissedCount: 1,
        nextRepromptDelay: { days: 7, hours: 0, minutes: 0, months: 0, seconds: 0 },
        variant: AB_TESTING_VARIANTS.B,
      });
    });

    it("skips transactions alerts when the reprompt delay has not been reached", () => {
      const decision = evaluateAfterActionTrigger(
        {
          source: "swap",
          permissionStatus: AuthorizationStatus.AUTHORIZED,
          areNotificationsAllowed: true,
          transactionsAlertsCategory: false,
          pushNotificationsDataOfUser: {
            dismissedPromptAtListByTarget: {
              transactionsAlertsCategory: [sub(NOW, { days: 2 }).getTime()],
            },
          },
        },
        createEvaluationContext({
          brazePushNotifications: createBrazePushNotificationsWithTransactionsAlerts(),
        }),
      );

      expect(decision).toEqual({
        kind: "skip",
        source: "swap",
        reason: "reprompt_delay_not_reached",
        dismissedCount: 1,
        nextRepromptDelay: { days: 7, hours: 0, minutes: 0, months: 0, seconds: 0 },
        variant: AB_TESTING_VARIANTS.B,
      });
    });

    it("skips transactions alerts when the completed action is not configured", () => {
      const decision = evaluateAfterActionTrigger(
        {
          source: "stake",
          permissionStatus: AuthorizationStatus.AUTHORIZED,
          areNotificationsAllowed: true,
          transactionsAlertsCategory: false,
          pushNotificationsDataOfUser: null,
        },
        createEvaluationContext({
          brazePushNotifications: createBrazePushNotificationsWithTransactionsAlerts(),
        }),
      );

      expect(decision).toEqual({
        kind: "skip",
        source: "stake",
        reason: "transactions_alerts_not_eligible",
        dismissedCount: 0,
        nextRepromptDelay: null,
        variant: AB_TESTING_VARIANTS.B,
      });
    });

    it("preserves variant A onboarding-only behavior", () => {
      const wordingFeature = createWordingFeature(AB_TESTING_VARIANTS.A);

      const nonOnboardingDecision = evaluateAfterActionTrigger(
        {
          source: "send",
          permissionStatus: AuthorizationStatus.NOT_DETERMINED,
          areNotificationsAllowed: true,
          ...defaultOptInState,
          pushNotificationsDataOfUser: null,
        },
        createEvaluationContext({ wordingFeature }),
      );

      const onboardingDecision = evaluateAfterActionTrigger(
        {
          source: "onboarding",
          permissionStatus: AuthorizationStatus.NOT_DETERMINED,
          areNotificationsAllowed: true,
          ...defaultOptInState,
          pushNotificationsDataOfUser: null,
        },
        createEvaluationContext({ wordingFeature }),
      );

      expect(nonOnboardingDecision).toEqual({
        kind: "skip",
        source: "send",
        reason: "variant_a_only_onboarding",
        dismissedCount: 0,
        nextRepromptDelay: null,
        variant: AB_TESTING_VARIANTS.A,
      });

      expect(onboardingDecision).toEqual({
        kind: "show",
        source: "onboarding",
        delayMs: 100,
        drawerPromptTarget: "globalPushNotifications",
        dismissedCount: 0,
        nextRepromptDelay: null,
        variant: AB_TESTING_VARIANTS.A,
      });
    });
  });

  describe("inactivity decisions", () => {
    it("skips when onboarding is not complete yet", () => {
      const decision = evaluateInactivityTrigger(
        {
          permissionStatus: AuthorizationStatus.DENIED,
          areNotificationsAllowed: true,
          pushNotificationsDataOfUser: {
            lastActionAt: sub(NOW, { months: 7 }).getTime(),
          },
          hasCompletedOnboarding: false,
        },
        createEvaluationContext(),
      );

      expect(decision).toEqual({
        kind: "skip",
        source: "inactivity",
        reason: "onboarding_incomplete",
        dismissedCount: 0,
        nextRepromptDelay: null,
        variant: AB_TESTING_VARIANTS.B,
      });
    });

    it("skips when the ratings modal is open", () => {
      const decision = evaluateInactivityTrigger(
        {
          permissionStatus: AuthorizationStatus.DENIED,
          areNotificationsAllowed: true,
          pushNotificationsDataOfUser: {
            lastActionAt: sub(NOW, { months: 7 }).getTime(),
          },
          hasCompletedOnboarding: true,
        },
        createEvaluationContext({ isRatingsModalOpen: true }),
      );

      expect(decision).toEqual({
        kind: "skip",
        source: "inactivity",
        reason: "ratings_modal_open",
        dismissedCount: 0,
        nextRepromptDelay: null,
        variant: AB_TESTING_VARIANTS.B,
      });
    });

    it("enforces first-in-wins when another drawer is pending", () => {
      const decision = evaluateInactivityTrigger(
        {
          permissionStatus: AuthorizationStatus.DENIED,
          areNotificationsAllowed: true,
          pushNotificationsDataOfUser: {
            lastActionAt: sub(NOW, { months: 7 }).getTime(),
          },
          hasCompletedOnboarding: true,
        },
        createEvaluationContext({ isDrawerPending: true }),
      );

      expect(decision).toEqual({
        kind: "skip",
        source: "inactivity",
        reason: "drawer_already_pending",
        dismissedCount: 0,
        nextRepromptDelay: null,
        variant: AB_TESTING_VARIANTS.B,
      });
    });

    it("shows the inactivity drawer when the user is eligible", () => {
      const decision = evaluateInactivityTrigger(
        {
          permissionStatus: AuthorizationStatus.DENIED,
          areNotificationsAllowed: true,
          pushNotificationsDataOfUser: {
            lastActionAt: sub(NOW, { months: 7 }).getTime(),
          },
          hasCompletedOnboarding: true,
        },
        createEvaluationContext(),
      );

      expect(decision).toEqual({
        kind: "show",
        source: "inactivity",
        delayMs: INACTIVITY_DRAWER_DELAY_MS,
        drawerPromptTarget: "globalPushNotifications",
        dismissedCount: 0,
        nextRepromptDelay: null,
        variant: AB_TESTING_VARIANTS.B,
      });
    });

    it("skips inactivity when globally opted in (transaction alerts only after action)", () => {
      const decision = evaluateInactivityTrigger(
        {
          permissionStatus: AuthorizationStatus.AUTHORIZED,
          areNotificationsAllowed: true,
          pushNotificationsDataOfUser: {
            lastActionAt: sub(NOW, { months: 7 }).getTime(),
          },
          hasCompletedOnboarding: true,
        },
        createEvaluationContext({
          brazePushNotifications: createBrazePushNotificationsWithTransactionsAlerts(),
        }),
      );

      expect(decision).toEqual({
        kind: "skip",
        source: "inactivity",
        reason: "globally_opted_in_no_inactivity_drawer",
        dismissedCount: 0,
        nextRepromptDelay: null,
        variant: AB_TESTING_VARIANTS.B,
      });
    });
  });

  describe("helper logic", () => {
    it("checks whether transactions alerts can be prompted for an action", () => {
      expect(
        canPromptTransactionsAlertsForAction("send", [transactionsAlertsCategoryConfig]),
      ).toBe(true);
      expect(
        canPromptTransactionsAlertsForAction("stake", [transactionsAlertsCategoryConfig]),
      ).toBe(false);
    });

    it("resolves the prompt target from global vs category opt-in state", () => {
      expect(
        getNotificationPromptTarget({
          permissionStatus: AuthorizationStatus.DENIED,
          areNotificationsAllowed: true,
          transactionsAlertsCategory: false,
        }),
      ).toBe("globalPushNotifications");

      expect(
        getNotificationPromptTarget({
          permissionStatus: AuthorizationStatus.AUTHORIZED,
          areNotificationsAllowed: true,
          transactionsAlertsCategory: false,
        }),
      ).toBe("transactionsAlertsCategory");

      expect(
        getNotificationPromptTarget({
          permissionStatus: AuthorizationStatus.AUTHORIZED,
          areNotificationsAllowed: true,
          transactionsAlertsCategory: true,
        }),
      ).toBeNull();
    });

    it("does not prompt the legacy global drawer when globally opted in", () => {
      expect(
        shouldPromptOptInDrawerAfterAction({
          permissionStatus: AuthorizationStatus.AUTHORIZED,
          areNotificationsAllowed: true,
          transactionsAlertsCategory: false,
          pushNotificationsDataOfUser: null,
        }),
      ).toBe(false);
    });

    it("prompts the legacy global drawer when not globally opted in and reprompt delay elapsed", () => {
      expect(
        shouldPromptOptInDrawerAfterAction({
          permissionStatus: AuthorizationStatus.DENIED,
          areNotificationsAllowed: true,
          transactionsAlertsCategory: false,
          pushNotificationsDataOfUser: null,
          repromptSchedule: defaultBrazePushNotificationsParams.reprompt_schedule,
          now: NOW,
        }),
      ).toBe(true);
    });

    it("keeps using the last reprompt bucket after the schedule is exhausted", () => {
      const nextRepromptDelay = getNextRepromptDelay({
        repromptSchedule: [
          { days: 7, hours: 0, minutes: 0, months: 0, seconds: 0 },
          { days: 30, hours: 0, minutes: 0, months: 0, seconds: 0 },
        ],
        permissionStatus: AuthorizationStatus.DENIED,
        areNotificationsAllowed: true,
        transactionsAlertsCategory: false,
        pushNotificationsDataOfUser: {
          dismissedOptInDrawerAtList: [NOW - 1, NOW - 2, NOW - 3],
        },
      });

      expect(nextRepromptDelay).toEqual({
        days: 30,
        hours: 0,
        minutes: 0,
        months: 0,
        seconds: 0,
      });
    });
  });
});
