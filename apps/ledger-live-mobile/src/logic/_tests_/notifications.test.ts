import { act, renderHook } from "@tests/test-renderer";
import { setPushNotificationsDataOfUserInStorage, useNotifications } from "../notifications";
import storage from "LLM/storage";
import { add, sub } from "date-fns";

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

const REPROMPT_SCHEDULE = [{ months: 1 }, { months: 3 }, { months: 6 }];

jest.mock("@ledgerhq/live-common/featureFlags/useFeature", () => {
  return jest.fn(name => {
    if (name === "brazePushNotifications") {
      return {
        enabled: true,
        params: {
          reprompt_schedule: REPROMPT_SCHEDULE,
        },
      };
    }
    return null;
  });
});

describe("useNotifications", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    jest.clearAllMocks();
  });
  afterEach(() => {
    storage.deleteAll();
    jest.useRealTimers();
  });

  const setup = async ({
    osPermission,
    appNotifications,
  }: {
    osPermission: (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];
    appNotifications: boolean;
  }) => {
    mockHasPermission.mockResolvedValue(osPermission);

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

  const advanceTime = (duration: Duration) => {
    jest.setSystemTime(add(Date.now(), duration));
  };

  describe("OS === undetermined", () => {
    it("app === false => should trigger the opt in drawer", async () => {
      const { result } = await setup({
        osPermission: AuthorizationStatus.NOT_DETERMINED,
        appNotifications: false,
      });

      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);
    });

    it("app === true => should trigger the opt in drawer", async () => {
      const { result } = await setup({
        osPermission: AuthorizationStatus.NOT_DETERMINED,
        appNotifications: true,
      });

      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);
    });
  });

  describe("OS === authorized", () => {
    it("app === false => should trigger the opt in drawer", async () => {
      const { result } = await setup({
        osPermission: AuthorizationStatus.AUTHORIZED,
        appNotifications: false,
      });

      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);
    });

    it("app === true => should not trigger the opt in drawer", async () => {
      const { result } = await setup({
        osPermission: AuthorizationStatus.AUTHORIZED,
        appNotifications: true,
      });

      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
    });
  });

  describe("OS === denied", () => {
    it("app === false => should not prompt immediately, then reprompt after delay", async () => {
      const { result } = await setup({
        osPermission: AuthorizationStatus.DENIED,
        appNotifications: false,
      });

      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
      advanceTime(REPROMPT_SCHEDULE[0]);
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);
    });

    it("app === true => should not prompt immediately, then reprompt after delay", async () => {
      const { result } = await setup({
        osPermission: AuthorizationStatus.DENIED,
        appNotifications: true,
      });

      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
      advanceTime(REPROMPT_SCHEDULE[0]);
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);
    });
  });

  describe("reprompt", () => {
    it("should prompt the opt in drawer at the next reprompt delay", async () => {
      const { result, store } = await setup({
        osPermission: AuthorizationStatus.NOT_DETERMINED,
        appNotifications: true,
      });
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);

      // 1st dismissal -> should reprompt after 1 month
      act(() => result.current.handleCloseFromBackdropPress());
      expect(store.getState().notifications.dataOfUser?.dismissedOptInDrawerAtList).toHaveLength(1);
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
      advanceTime(REPROMPT_SCHEDULE[0]);
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);

      // 2nd dismissal -> should reprompt after 3 months
      act(() => result.current.handleCloseFromBackdropPress());
      expect(store.getState().notifications.dataOfUser?.dismissedOptInDrawerAtList).toHaveLength(2);
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
      advanceTime(REPROMPT_SCHEDULE[1]);
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);

      // 3rd dismissal -> should reprompt after 6 months
      act(() => result.current.handleCloseFromBackdropPress());
      expect(store.getState().notifications.dataOfUser?.dismissedOptInDrawerAtList).toHaveLength(3);
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
      advanceTime(REPROMPT_SCHEDULE[2]);
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);

      // Schedule has 3 entries; further dismissals keep using the last delay (6 months)
      // 4th dismissal
      act(() => result.current.handleCloseFromBackdropPress());
      expect(store.getState().notifications.dataOfUser?.dismissedOptInDrawerAtList).toHaveLength(4);
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
      advanceTime(REPROMPT_SCHEDULE[2]);
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);

      // 5th dismissal
      act(() => result.current.handleCloseFromBackdropPress());
      expect(store.getState().notifications.dataOfUser?.dismissedOptInDrawerAtList).toHaveLength(5);
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
      advanceTime(REPROMPT_SCHEDULE[2]);
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);
    });

    it("should stop reprompting when the user finally opts in", async () => {
      const { result, store } = await setup({
        osPermission: AuthorizationStatus.NOT_DETERMINED,
        appNotifications: true,
      });
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);

      act(() => result.current.handleCloseFromBackdropPress());
      expect(store.getState().notifications.dataOfUser?.dismissedOptInDrawerAtList).toHaveLength(1);
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
      advanceTime(REPROMPT_SCHEDULE[0]);
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);

      await act(async () => {
        mockRequestPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
        await result.current.handleAllowNotificationsPress();
      });

      expect(store.getState().notifications.dataOfUser?.dismissedOptInDrawerAtList).toBeUndefined();
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);

      advanceTime({ months: 12 });
      expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
    });
  });

  describe("backwards compatibility", () => {
    describe("already opted in notifications", () => {
      it("alreadyDelayedToLater: should reset the opt out state and prompt the opt in drawer in the next reprompt delay", async () => {
        await setPushNotificationsDataOfUserInStorage({
          alreadyDelayedToLater: true,
        });

        const { result } = await setup({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: true,
        });
        expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
        advanceTime(REPROMPT_SCHEDULE[0]);
        expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
        advanceTime(REPROMPT_SCHEDULE[1]);
        expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
        advanceTime(REPROMPT_SCHEDULE[2]);
        expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
      });

      it("dateOfNextAllowedRequest: should prompt the opt in drawer in the next reprompt delay", async () => {
        await setPushNotificationsDataOfUserInStorage({
          dateOfNextAllowedRequest: sub(new Date(), { months: 1 }),
        });

        const { result } = await setup({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: true,
        });
        expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
        advanceTime(REPROMPT_SCHEDULE[0]);
        expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
        advanceTime(REPROMPT_SCHEDULE[1]);
        expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
        advanceTime(REPROMPT_SCHEDULE[2]);
        expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
      });
    });

    describe("already opted out notifications", () => {
      const LONG_TIME_AGO = sub(new Date(), { years: 1 });

      describe("OS === denied", () => {
        it("app === true => should prompt the opt in drawer in the next reprompt delay and the start date to be at the app start date", async () => {
          await setPushNotificationsDataOfUserInStorage({
            dateOfNextAllowedRequest: LONG_TIME_AGO,
          });

          const { result } = await setup({
            osPermission: AuthorizationStatus.DENIED,
            appNotifications: true,
          });
          expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
          advanceTime({
            days: 8,
          });
          expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
          advanceTime(REPROMPT_SCHEDULE[0]);
          expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);
        });

        it("app === false => should prompt the opt in drawer in the next reprompt delay and the start date to be at the app start date", async () => {
          await setPushNotificationsDataOfUserInStorage({
            dateOfNextAllowedRequest: LONG_TIME_AGO,
          });
          const { result } = await setup({
            osPermission: AuthorizationStatus.DENIED,
            appNotifications: false,
          });
          expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
          advanceTime({
            days: 15,
          });
          expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
          advanceTime(REPROMPT_SCHEDULE[0]);
          expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);
        });
      });

      describe("OS === authorized", () => {
        it("app === false => should prompt the opt in drawer in the next reprompt delay and the start date to be at the app start date", async () => {
          await setPushNotificationsDataOfUserInStorage({
            dateOfNextAllowedRequest: LONG_TIME_AGO,
          });

          const { result } = await setup({
            osPermission: AuthorizationStatus.AUTHORIZED,
            appNotifications: false,
          });
          advanceTime({
            weeks: 3,
          });
          expect(result.current.verifyShouldPromptOptInDrawer()).toBe(false);
          advanceTime(REPROMPT_SCHEDULE[0]);
          expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);
          advanceTime(REPROMPT_SCHEDULE[1]);
          expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);
          advanceTime(REPROMPT_SCHEDULE[2]);
          expect(result.current.verifyShouldPromptOptInDrawer()).toBe(true);
        });
      });
    });
  });
});
