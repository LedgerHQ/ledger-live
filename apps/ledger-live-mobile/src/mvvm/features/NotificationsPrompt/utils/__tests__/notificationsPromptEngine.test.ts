import { sub } from "date-fns";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { ABTestingVariants } from "@ledgerhq/types-live";
import type {
  Feature_BrazePushNotifications,
  Feature_LwmNewWordingOptInNotificationsDrawer,
} from "@ledgerhq/types-live";
import {
  INACTIVITY_DRAWER_DELAY_MS,
  evaluateAfterActionTrigger,
  evaluateInactivityTrigger,
  getNextRepromptDelay,
} from "../notificationsPromptEngine";

const NOW = new Date("2026-01-01T00:00:00.000Z").getTime();

const createBrazePushNotificationsFeature = (
  overrides?: Partial<Feature_BrazePushNotifications>,
): Feature_BrazePushNotifications =>
  ({
    enabled: true,
    params: {
      reprompt_schedule: [{ days: 7, hours: 0, minutes: 0, months: 0, seconds: 0 }],
      action_events: {
        complete_onboarding: { enabled: true, timer: 100 },
        send: { enabled: true, timer: 200 },
        receive: { enabled: true, timer: 300 },
        buy: { enabled: true, timer: 400 },
        swap: { enabled: true, timer: 500 },
        stake: { enabled: true, timer: 600 },
        add_favorite_coin: { enabled: true, timer: 700 },
      },
      inactivity_enabled: true,
      inactivity_reprompt: { days: 0, hours: 0, minutes: 0, months: 6, seconds: 0 },
      notificationsCategories: [],
    },
    ...overrides,
  }) as Feature_BrazePushNotifications;

const createWordingFeature = (
  variant: ABTestingVariants = ABTestingVariants.variantB,
): Feature_LwmNewWordingOptInNotificationsDrawer =>
  ({
    enabled: true,
    params: { variant },
  }) as Feature_LwmNewWordingOptInNotificationsDrawer;

type EvaluationContext = {
  brazePushNotifications: Feature_BrazePushNotifications;
  wordingFeature: Feature_LwmNewWordingOptInNotificationsDrawer;
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
          pushNotificationsDataOfUser: null,
        },
        createEvaluationContext(),
      );

      expect(decision).toEqual({
        kind: "show",
        source: "send",
        delayMs: 200,
        dismissedCount: 0,
        nextRepromptDelay: null,
        variant: ABTestingVariants.variantB,
      });
    });

    it("skips when the user is already fully opted in", () => {
      const decision = evaluateAfterActionTrigger(
        {
          source: "send",
          permissionStatus: AuthorizationStatus.AUTHORIZED,
          areNotificationsAllowed: true,
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
        variant: ABTestingVariants.variantB,
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
        variant: ABTestingVariants.variantB,
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
          pushNotificationsDataOfUser,
        },
        createEvaluationContext(),
      );

      expect(decision).toEqual({
        kind: "show",
        source: "send",
        delayMs: 200,
        dismissedCount: 1,
        nextRepromptDelay: { days: 7, hours: 0, minutes: 0, months: 0, seconds: 0 },
        variant: ABTestingVariants.variantB,
      });
    });

    it("preserves variant A onboarding-only behavior", () => {
      const wordingFeature = createWordingFeature(ABTestingVariants.variantA);

      const nonOnboardingDecision = evaluateAfterActionTrigger(
        {
          source: "send",
          permissionStatus: AuthorizationStatus.NOT_DETERMINED,
          areNotificationsAllowed: true,
          pushNotificationsDataOfUser: null,
        },
        createEvaluationContext({ wordingFeature }),
      );

      const onboardingDecision = evaluateAfterActionTrigger(
        {
          source: "onboarding",
          permissionStatus: AuthorizationStatus.NOT_DETERMINED,
          areNotificationsAllowed: true,
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
        variant: ABTestingVariants.variantA,
      });

      expect(onboardingDecision).toEqual({
        kind: "show",
        source: "onboarding",
        delayMs: 100,
        dismissedCount: 0,
        nextRepromptDelay: null,
        variant: ABTestingVariants.variantA,
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
        variant: ABTestingVariants.variantB,
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
        variant: ABTestingVariants.variantB,
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
        variant: ABTestingVariants.variantB,
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
        dismissedCount: 0,
        nextRepromptDelay: null,
        variant: ABTestingVariants.variantB,
      });
    });
  });

  describe("helper logic", () => {
    it("keeps using the last reprompt bucket after the schedule is exhausted", () => {
      const nextRepromptDelay = getNextRepromptDelay({
        repromptSchedule: [
          { days: 7, hours: 0, minutes: 0, months: 0, seconds: 0 },
          { days: 30, hours: 0, minutes: 0, months: 0, seconds: 0 },
        ],
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
