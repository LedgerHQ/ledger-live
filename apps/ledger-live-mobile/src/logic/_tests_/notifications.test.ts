import { act, renderHook } from "@tests/test-renderer";
import { setPushNotificationsDataOfUserInStorage, useNotifications } from "../notifications";
import storage from "LLM/storage";
import { add, sub, type Duration } from "date-fns";

const AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
  EPHEMERAL: 3,
} as const;

type AuthorizationStatusType = (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];

const mockRequestPermission = jest.fn<Promise<AuthorizationStatusType>, []>(() =>
  Promise.resolve(AuthorizationStatus.AUTHORIZED),
);
const mockHasPermission = jest.fn<Promise<AuthorizationStatusType>, []>(() =>
  Promise.resolve(AuthorizationStatus.AUTHORIZED),
);

jest.mock("@react-native-firebase/messaging", () => {
  const AuthorizationStatus = {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    EPHEMERAL: 3,
  } as const;
  return {
    AuthorizationStatus,
    getMessaging: jest.fn(() => ({
      requestPermission: mockRequestPermission,
      hasPermission: mockHasPermission,
    })),
  };
});

const REPROMPT_SCHEDULE = [{ months: 1 }, { months: 3 }, { months: 6 }] as const;

jest.mock("@ledgerhq/live-common/featureFlags/useFeature", () => {
  return jest.fn(name => {
    if (name === "brazePushNotifications") {
      return {
        enabled: true,
        params: {
          action_events: {
            complete_onboarding: {
              enabled: true,
              timer: 0,
            },

            add_favorite_coin: {
              enabled: true,
              timer: 0,
            },

            send: {
              enabled: true,
              timer: 0,
            },
            receive: {
              enabled: true,
              timer: 0,
            },
            buy: {
              enabled: true,
              timer: 0,
            },
            swap: {
              enabled: true,
              timer: 0,
            },
            stake: {
              enabled: true,
              timer: 0,
            },
          },
          reprompt_schedule: REPROMPT_SCHEDULE,

          notificationsCategories: [
            {
              displayed: true,
              category: "announcementsCategory",
            },
            {
              displayed: true,
              category: "recommendationsCategory",
            },
            {
              displayed: true,
              category: "largeMoverCategory",
            },
            {
              displayed: true,
              category: "transactionsAlertsCategory",
            },
          ],
          trigger_events: [
            {
              route_name: "PortfolioNavigator",
              timer: 3000,
              type: "on_enter",
            },
            {
              route_name: "Wallet",
              timer: 3000,
              type: "on_enter",
            },
          ],

          marketCoinStarred: {
            enabled: true,
            timer: 3000,
          },
          justFinishedOnboarding: {
            enabled: true,
            timer: 3000,
          },
          conditions: {
            default_delay_between_two_prompts: {
              seconds: 10,
            },
            maybe_later_delay: {
              seconds: 10,
            },
            minimum_accounts_with_funds_number: 1,
            minimum_app_starts_number: 1,
            minimum_duration_since_app_first_start: {
              seconds: 10,
            },
          },
        },
      };
    }

    console.error(`Unhandled feature flag: ${name}`);

    return {
      enabled: true,
    };
  });
});

describe("Push Notification Drawer", () => {
  beforeEach(async () => {
    jest.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));

    mockRequestPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
    mockHasPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);

    await storage.deleteAll();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  const advanceTime = (duration: Duration) => {
    const now = Date.now();
    const durationInMs = add(now, duration).getTime() - now;
    act(() => jest.advanceTimersByTime(durationInMs));
  };

  const setupHook = async ({
    appNotifications,
    osPermission,
    dismissedOptInDrawerAtList,
  }: {
    appNotifications: boolean;
    osPermission: AuthorizationStatusType;
    dismissedOptInDrawerAtList?: number[];
  }) => {
    mockHasPermission.mockResolvedValue(osPermission);

    if (dismissedOptInDrawerAtList) {
      await setPushNotificationsDataOfUserInStorage({
        dismissedOptInDrawerAtList,
      });
    }

    const rendered = renderHook(() => useNotifications(), {
      overrideInitialState: state => {
        state.settings.notifications.areNotificationsAllowed = appNotifications;
        return state;
      },
    });

    await act(async () => {
      await rendered.result.current.initPushNotificationsData();
    });

    return rendered;
  };

  describe("sync opt in/out state to decide if we should prompt the opt in drawer", () => {
    describe("OS === denied", () => {
      it("app === false => should not prompt immediately, then prompt after delay", async () => {
        const { result } = await setupHook({
          osPermission: AuthorizationStatus.DENIED,
          appNotifications: false,
        });

        // Should not prompt immediately when OS is denied
        expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

        // Should prompt after reprompt delay
        advanceTime(REPROMPT_SCHEDULE[0]);
        expect(result.current.shouldPromptOptInDrawerCallback()).toBe(true);
      });

      it("app === true => should not prompt immediately, then prompt after delay", async () => {
        const { result } = await setupHook({
          osPermission: AuthorizationStatus.DENIED,
          appNotifications: true,
        });

        // Should not prompt immediately when OS is denied
        expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

        // Should prompt after reprompt delay
        advanceTime(REPROMPT_SCHEDULE[0]);
        expect(result.current.shouldPromptOptInDrawerCallback()).toBe(true);
      });
    });

    describe("OS === authorized", () => {
      it("app === false => should prompt immediately", async () => {
        const { result } = await setupHook({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: false,
        });

        expect(result.current.shouldPromptOptInDrawerCallback()).toBe(true);
      });

      it("app === true => should not prompt", async () => {
        const { result } = await setupHook({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: true,
        });

        expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);
      });
    });

    describe("OS === undetermined", () => {
      it("app === false => should prompt immediately", async () => {
        const { result } = await setupHook({
          osPermission: AuthorizationStatus.NOT_DETERMINED,
          appNotifications: false,
        });

        expect(result.current.shouldPromptOptInDrawerCallback()).toBe(true);
      });

      it("app === true => should prompt immediately", async () => {
        const { result } = await setupHook({
          osPermission: AuthorizationStatus.NOT_DETERMINED,
          appNotifications: true,
        });

        expect(result.current.shouldPromptOptInDrawerCallback()).toBe(true);
      });
    });
  });

  describe("dismissal", () => {
    it("should mark the user as opted out after dismissal from backdrop", async () => {
      const { result, store } = await setupHook({
        osPermission: AuthorizationStatus.NOT_DETERMINED,
        appNotifications: true,
      });

      act(() => result.current.handleCloseFromBackdropPress());

      const dismissedOptInDrawerAtList =
        store.getState().notifications.dataOfUser?.dismissedOptInDrawerAtList;
      expect(dismissedOptInDrawerAtList).toHaveLength(1);
      expect(dismissedOptInDrawerAtList?.[0]).toBe(Date.now());
    });

    it("should mark the user as opted out after dismissal from delay later text", async () => {
      const { result, store } = await setupHook({
        osPermission: AuthorizationStatus.NOT_DETERMINED,
        appNotifications: true,
      });

      result.current.handleDelayLaterPress();

      const dismissedOptInDrawerAtList =
        store.getState().notifications.dataOfUser?.dismissedOptInDrawerAtList;
      expect(dismissedOptInDrawerAtList).toHaveLength(1);
      expect(dismissedOptInDrawerAtList?.[0]).toBe(Date.now());
    });
  });

  describe("multiple reprompt", () => {
    it("with 1 dismissal, shows after 1st delay (1 month)", async () => {
      const { result } = await setupHook({
        dismissedOptInDrawerAtList: [Date.now()],
        osPermission: AuthorizationStatus.DENIED,
        appNotifications: true,
      });

      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

      advanceTime(REPROMPT_SCHEDULE[0]);
      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(true);
    });

    it("with 2 dismissals, shows after 2nd delay (3 months)", async () => {
      const { result } = await setupHook({
        dismissedOptInDrawerAtList: [sub(new Date(), { months: 12 }).getTime(), Date.now()],
        osPermission: AuthorizationStatus.DENIED,
        appNotifications: true,
      });

      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

      advanceTime(REPROMPT_SCHEDULE[0]);
      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

      advanceTime(REPROMPT_SCHEDULE[1]);
      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(true);
    });

    it("with 3 dismissals, shows after 3rd delay (6 months)", async () => {
      const { result } = await setupHook({
        dismissedOptInDrawerAtList: [
          sub(new Date(), { months: 12 }).getTime(),
          sub(new Date(), { months: 9 }).getTime(),
          Date.now(),
        ],
        osPermission: AuthorizationStatus.DENIED,
        appNotifications: true,
      });

      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

      advanceTime(REPROMPT_SCHEDULE[1]);
      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

      advanceTime(REPROMPT_SCHEDULE[2]);
      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(true);
    });

    it("with 4+ dismissals, continues using last delay (6 months)", async () => {
      const { result } = await setupHook({
        dismissedOptInDrawerAtList: [
          sub(new Date(), { months: 18 }).getTime(),
          sub(new Date(), { months: 12 }).getTime(),
          sub(new Date(), { months: 9 }).getTime(),
          Date.now(),
        ],
        osPermission: AuthorizationStatus.DENIED,
        appNotifications: false,
      });

      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

      advanceTime(REPROMPT_SCHEDULE[1]);
      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

      advanceTime(REPROMPT_SCHEDULE[2]);
      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(true);
    });

    it("should never show drawer again after user opts in", async () => {
      const { result } = await setupHook({
        dismissedOptInDrawerAtList: [sub(new Date(), { months: 12 }).getTime()],
        osPermission: AuthorizationStatus.DENIED,
        appNotifications: true,
      });

      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(true);

      // opt in
      mockRequestPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
      mockHasPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);

      await act(async () => {
        await result.current.handleAllowNotificationsPress();
      });

      // Re-initialize to pick up the new permission status
      await act(async () => {
        await result.current.initPushNotificationsData();
      });

      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

      advanceTime(REPROMPT_SCHEDULE[0]);
      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

      advanceTime(REPROMPT_SCHEDULE[1]);
      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

      advanceTime(REPROMPT_SCHEDULE[2]);
      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

      advanceTime({
        years: 99,
      });
      expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);
    });
  });

  describe("backwards compatibility", () => {
    describe("already opted in notifications", () => {
      it("alreadyDelayedToLater: should not show drawer", async () => {
        await setPushNotificationsDataOfUserInStorage({
          alreadyDelayedToLater: true,
        });

        const { result } = await setupHook({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: true,
        });

        advanceTime(REPROMPT_SCHEDULE[0]);
        expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);
      });

      it("dateOfNextAllowedRequest: should not show drawer", async () => {
        await setPushNotificationsDataOfUserInStorage({
          dateOfNextAllowedRequest: sub(new Date(), { months: 1 }),
        });

        const { result } = await setupHook({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: true,
        });

        advanceTime(REPROMPT_SCHEDULE[0]);
        expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);
      });
    });

    describe("already opted out notifications", () => {
      const LONG_TIME_AGO = sub(new Date(), { years: 1 });

      describe("OS === denied", () => {
        it("app === true => should show drawer after reprompt delay", async () => {
          await setPushNotificationsDataOfUserInStorage({
            dateOfNextAllowedRequest: LONG_TIME_AGO,
          });

          const { result } = await setupHook({
            osPermission: AuthorizationStatus.DENIED,
            appNotifications: true,
          });

          // Advance some time but not enough to trigger reprompt
          advanceTime({ days: 8 });
          expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

          advanceTime(REPROMPT_SCHEDULE[0]);
          expect(result.current.shouldPromptOptInDrawerCallback()).toBe(true);
        });

        it("app === false => should show drawer after reprompt delay", async () => {
          await setPushNotificationsDataOfUserInStorage({
            dateOfNextAllowedRequest: LONG_TIME_AGO,
          });

          const { result } = await setupHook({
            osPermission: AuthorizationStatus.DENIED,
            appNotifications: false,
          });

          // Advance some time but not enough to trigger reprompt
          advanceTime({ days: 15 });
          expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

          advanceTime(REPROMPT_SCHEDULE[0]);
          expect(result.current.shouldPromptOptInDrawerCallback()).toBe(true);
        });
      });

      describe("OS === authorized", () => {
        it("app === false => should show drawer immediately after initial period", async () => {
          await setPushNotificationsDataOfUserInStorage({
            dateOfNextAllowedRequest: LONG_TIME_AGO,
          });

          const { result } = await setupHook({
            osPermission: AuthorizationStatus.AUTHORIZED,
            appNotifications: false,
          });

          // Advance some time but not enough to trigger reprompt
          advanceTime({ weeks: 3 });

          expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

          advanceTime(REPROMPT_SCHEDULE[0]);

          expect(result.current.shouldPromptOptInDrawerCallback()).toBe(true);
        });
      });

      it("dateOfNextAllowedRequest: should show drawer", async () => {
        await setPushNotificationsDataOfUserInStorage({
          dateOfNextAllowedRequest: LONG_TIME_AGO,
        });

        const { result } = await setupHook({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: false,
        });

        expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);

        advanceTime(REPROMPT_SCHEDULE[0]);
        expect(result.current.shouldPromptOptInDrawerCallback()).toBe(true);
      });
    });
  });
});
