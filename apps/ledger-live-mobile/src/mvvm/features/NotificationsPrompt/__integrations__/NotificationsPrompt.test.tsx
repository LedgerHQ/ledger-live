import React, { useEffect, useReducer, useState } from "react";
import { act, render, screen, waitFor } from "@tests/test-renderer";
import { useNotifications } from "../hooks/useNotifications";

import storage from "LLM/storage";
import { add, sub, type Duration } from "date-fns";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { NotificationsPromptDrawer } from "../screens/NotificationsPromptDrawer";
import { setPushNotificationsDataOfUserInStorage } from "../utils/storage";
import { NotificationsState } from "~/reducers/types";

// Mock QueuedDrawer to bypass animation issues with Reanimated 4 in tests
jest.mock("~/components/QueuedDrawer", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Pressable } = require("react-native");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => {
      if (!props.isRequestingToBeOpened) return React.createElement(View, null);
      return React.createElement(
        View,
        null,
        React.createElement(Pressable, {
          testID: "drawer-backdrop",
          onPress: props.onBackdropPress,
        }),
        props.children,
      );
    },
  };
});

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

const REPROMPT_SCHEDULE = [{ days: 7 }, { days: 30 }, { days: 90 }] as const;
const INACTIVITY_REPROMPT = { months: 6 } as const;

describe("NotificationsPrompt Integration", () => {
  async function setup({
    actionSource = "onboarding",
    osPermission,
    appNotifications,
    lastActionAt,
    dateOfNextAllowedRequest,
    alreadyDelayedToLater,
    variant = ABTestingVariants.variantB,
  }: {
    actionSource?: Exclude<NotificationsState["drawerSource"], undefined | "inactivity">;
    osPermission: AuthorizationStatusType;
    appNotifications: boolean;
    lastActionAt?: number;
    dateOfNextAllowedRequest?: Date;
    alreadyDelayedToLater?: boolean;
    variant?: ABTestingVariants;
  }) {
    mockHasPermission.mockResolvedValue(osPermission);
    mockRequestPermission.mockResolvedValue(osPermission);
    await setPushNotificationsDataOfUserInStorage({
      lastActionAt,
      dateOfNextAllowedRequest,
      alreadyDelayedToLater,
    });

    function SetupComponent() {
      const [isReady, setIsReady] = useState(false);
      const [reloadCount, reload] = useReducer(x => x + 1, 0);

      const {
        tryTriggerPushNotificationDrawerAfterAction,
        initPushNotificationsData,
        tryTriggerPushNotificationDrawerAfterInactivity,
      } = useNotifications();

      useEffect(() => {
        initPushNotificationsData()
          .then(tryTriggerPushNotificationDrawerAfterInactivity)
          .then(() => setIsReady(true));

        // No dependency because we only want to run it once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [reloadCount]);

      if (!isReady) {
        return <Text>Loading permission status and push notifications data of user</Text>;
      }

      return (
        <>
          <Button onPress={() => tryTriggerPushNotificationDrawerAfterAction(actionSource)}>
            Trigger drawer
          </Button>
          <Button onPress={reload}>Reload app</Button>
        </>
      );
    }

    const rendered = render(
      <>
        <NotificationsPromptDrawer />
        <SetupComponent />
      </>,
      {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            notifications: {
              ...state.settings.notifications,
              areNotificationsAllowed: appNotifications,
            },
            overriddenFeatureFlags: {
              ...state.settings.overriddenFeatureFlags,
              brazePushNotifications: {
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

                  inactivity_enabled: true,
                  inactivity_reprompt: INACTIVITY_REPROMPT,
                },
              },
              lwmNewWordingOptInNotificationsDrawer: {
                enabled: true,
                params: {
                  variant,
                },
              },
            },
          },
        }),
      },
    );

    const tryTriggerDrawer = async () => {
      const triggerDrawerButton = await screen.findByRole("button", { name: /trigger drawer/i });
      await rendered.user.press(triggerDrawerButton);
      act(() => jest.runOnlyPendingTimers());
    };

    await waitFor(() => {
      expect(
        screen.queryByText(/Loading permission status and push notifications data of user/i),
      ).not.toBeOnTheScreen();
    });

    return {
      ...rendered,
      tryTriggerDrawer,
    };
  }

  beforeEach(async () => {
    jest.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));

    mockRequestPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
    mockHasPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);

    await storage.deleteAll();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const advanceTime = (duration: Duration) => {
    const now = Date.now();
    const newTime = add(now, duration);
    jest.setSystemTime(newTime);
    act(() => jest.advanceTimersByTime(newTime.getTime() - now));
  };

  describe("after an action", () => {
    describe("backward compatibility for legacy users", () => {
      describe("opt in", () => {
        it("alreadyDelayedToLater: should never prompt", async () => {
          const { tryTriggerDrawer } = await setup({
            osPermission: AuthorizationStatus.AUTHORIZED,
            appNotifications: true,
            alreadyDelayedToLater: true,
          });

          await tryTriggerDrawer();
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

          advanceTime(REPROMPT_SCHEDULE[0]);
          await tryTriggerDrawer();
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

          advanceTime(REPROMPT_SCHEDULE[1]);
          await tryTriggerDrawer();
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
        });

        it("dateOfNextAllowedRequest: should never prompt", async () => {
          const { tryTriggerDrawer } = await setup({
            osPermission: AuthorizationStatus.AUTHORIZED,
            appNotifications: true,
            dateOfNextAllowedRequest: sub(new Date(), { years: 10 }),
          });

          await tryTriggerDrawer();
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

          advanceTime(REPROMPT_SCHEDULE[0]);
          await tryTriggerDrawer();
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

          advanceTime(REPROMPT_SCHEDULE[1]);
          await tryTriggerDrawer();
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
        });
      });

      describe("opt out", () => {
        describe("os denied", () => {
          it("alreadyDelayedToLater: should prompt only after the next reprompt delay", async () => {
            const { tryTriggerDrawer } = await setup({
              osPermission: AuthorizationStatus.DENIED,
              appNotifications: true,
              alreadyDelayedToLater: true,
            });

            await tryTriggerDrawer();
            expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

            advanceTime(REPROMPT_SCHEDULE[0]);
            await tryTriggerDrawer();
            expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
          });

          it("dateOfNextAllowedRequest: should prompt only after the next reprompt delay", async () => {
            const { tryTriggerDrawer } = await setup({
              osPermission: AuthorizationStatus.DENIED,
              appNotifications: true,
              dateOfNextAllowedRequest: add(new Date(), { years: 10 }),
            });

            await tryTriggerDrawer();
            expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

            advanceTime(REPROMPT_SCHEDULE[0]);
            await tryTriggerDrawer();
            expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
          });
        });
        describe("app notifications = false", () => {
          it("alreadyDelayedToLater: should prompt only after the next reprompt delay", async () => {
            const { tryTriggerDrawer } = await setup({
              osPermission: AuthorizationStatus.AUTHORIZED,
              appNotifications: false,
              alreadyDelayedToLater: true,
            });

            await tryTriggerDrawer();
            expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

            advanceTime(REPROMPT_SCHEDULE[0]);
            await tryTriggerDrawer();
            expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
          });

          it("dateOfNextAllowedRequest: should prompt only after the next reprompt delay", async () => {
            const { tryTriggerDrawer } = await setup({
              osPermission: AuthorizationStatus.AUTHORIZED,
              appNotifications: false,
              dateOfNextAllowedRequest: add(new Date(), { years: 10 }),
            });

            await tryTriggerDrawer();
            expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

            advanceTime(REPROMPT_SCHEDULE[0]);
            await tryTriggerDrawer();
            expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
          });
        });
      });
    });

    describe("first time prompt", () => {
      describe("os not determined", () => {
        it("app notifications = false, should prompt immediately", async () => {
          const { tryTriggerDrawer } = await setup({
            osPermission: AuthorizationStatus.NOT_DETERMINED,
            appNotifications: false,
          });

          await tryTriggerDrawer();
          expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
        });

        it("app notifications = true, should prompt immediately", async () => {
          const { tryTriggerDrawer } = await setup({
            osPermission: AuthorizationStatus.NOT_DETERMINED,
            appNotifications: true,
          });

          await tryTriggerDrawer();
          expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
        });
      });

      describe("os denied", () => {
        it("app notifications = false, should not prompt immediately, then prompt after delay", async () => {
          const { tryTriggerDrawer } = await setup({
            osPermission: AuthorizationStatus.DENIED,
            appNotifications: false,
          });

          await tryTriggerDrawer();
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

          advanceTime(REPROMPT_SCHEDULE[0]);

          await tryTriggerDrawer();
          expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
        });

        it("app notifications = true, should not prompt immediately, then prompt after delay", async () => {
          const { tryTriggerDrawer } = await setup({
            osPermission: AuthorizationStatus.DENIED,
            appNotifications: true,
          });

          await tryTriggerDrawer();
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

          advanceTime(REPROMPT_SCHEDULE[0]);

          await tryTriggerDrawer();
          expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
        });
      });

      describe("os authorized", () => {
        it("app notifications = true, should never prompt", async () => {
          const { tryTriggerDrawer } = await setup({
            osPermission: AuthorizationStatus.AUTHORIZED,
            appNotifications: true,
          });

          await tryTriggerDrawer();
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

          advanceTime(REPROMPT_SCHEDULE[0]);

          await tryTriggerDrawer();
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

          advanceTime(REPROMPT_SCHEDULE[1]);
          await tryTriggerDrawer();
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
        });

        it.skip("app notifications = false, should not prompt immediately", () => {
          // this can only be tested E2E since the user will have to go to the settings to disable app notifications
          // when the user opts out of app notifications, he will be marked as opted out and will be prompted later based on reprompt_schedule
        });
      });
    });

    describe("multiple reprompts", () => {
      it("should never reprompt ever again when user finally opts in notifications", async () => {
        const { tryTriggerDrawer, user } = await setup({
          osPermission: AuthorizationStatus.NOT_DETERMINED,
          appNotifications: true,
        });

        await tryTriggerDrawer();
        const allowNotificationsButton = screen.getByText(/allow notifications/i);
        expect(allowNotificationsButton).toBeOnTheScreen();

        mockRequestPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
        mockHasPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
        await user.press(allowNotificationsButton);
        await waitFor(() => expect(allowNotificationsButton).not.toBeOnTheScreen());

        advanceTime({
          years: 999,
        });
        await tryTriggerDrawer();
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

        advanceTime({
          years: 999,
        });
        await tryTriggerDrawer();
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
      });

      it("should reprompt after each delay when user opts out notifications by clicking on maybe later text", async () => {
        const { tryTriggerDrawer, user } = await setup({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: false,
        });

        await tryTriggerDrawer();
        const maybeLaterButton = screen.getByText(/maybe later/i);
        expect(maybeLaterButton).toBeOnTheScreen();

        mockRequestPermission.mockResolvedValue(AuthorizationStatus.DENIED);
        mockHasPermission.mockResolvedValue(AuthorizationStatus.DENIED);
        await user.press(maybeLaterButton);
        await waitFor(() => expect(maybeLaterButton).not.toBeOnTheScreen());

        advanceTime(REPROMPT_SCHEDULE[0]);
        await tryTriggerDrawer();
        const maybeLaterButton1 = screen.getByText(/maybe later/i);
        expect(maybeLaterButton1).toBeOnTheScreen();
        await user.press(maybeLaterButton1);
        await waitFor(() => expect(maybeLaterButton1).not.toBeOnTheScreen());

        advanceTime(REPROMPT_SCHEDULE[1]);
        await tryTriggerDrawer();
        const maybeLaterButton2 = screen.getByText(/maybe later/i);
        expect(maybeLaterButton2).toBeOnTheScreen();
        await user.press(screen.getByText(/maybe later/i));
        await waitFor(() => expect(maybeLaterButton2).not.toBeOnTheScreen());

        advanceTime(REPROMPT_SCHEDULE[2]);
        await tryTriggerDrawer();
        const maybeLaterButton3 = screen.getByText(/maybe later/i);
        expect(maybeLaterButton3).toBeOnTheScreen();
        await user.press(maybeLaterButton3);
        await waitFor(() => expect(maybeLaterButton3).not.toBeOnTheScreen());

        // It should reprompt using the maximum delay, since we've already dismissed the drawer as many times as the length of reprompt_schedule allows.
        advanceTime(REPROMPT_SCHEDULE[0]);
        await tryTriggerDrawer();
        expect(screen.queryByText(/maybe later/i)).not.toBeOnTheScreen();
        advanceTime(REPROMPT_SCHEDULE[2]);
        await tryTriggerDrawer();
        expect(screen.getByText(/maybe later/i)).toBeOnTheScreen();
      });

      it("should reprompt after each delay when user opts out notifications by clicking on backdrop", async () => {
        const { tryTriggerDrawer, user } = await setup({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: false,
        });

        await tryTriggerDrawer();
        const backdrop = screen.getByTestId("drawer-backdrop");
        await user.press(backdrop);
        await waitFor(() => expect(backdrop).not.toBeOnTheScreen());

        advanceTime(REPROMPT_SCHEDULE[0]);
        await tryTriggerDrawer();
        const backdrop1 = screen.getByTestId("drawer-backdrop");
        expect(backdrop1).toBeOnTheScreen();
        await user.press(backdrop1);
        await waitFor(() => expect(backdrop1).not.toBeOnTheScreen());

        advanceTime(REPROMPT_SCHEDULE[1]);
        await tryTriggerDrawer();
        const backdrop2 = screen.getByTestId("drawer-backdrop");
        expect(backdrop2).toBeOnTheScreen();
        await user.press(backdrop2);
        await waitFor(() => expect(backdrop2).not.toBeOnTheScreen());

        advanceTime(REPROMPT_SCHEDULE[2]);
        await tryTriggerDrawer();
        const backdrop3 = screen.getByTestId("drawer-backdrop");
        expect(backdrop3).toBeOnTheScreen();
        await user.press(backdrop3);
        await waitFor(() => expect(backdrop3).not.toBeOnTheScreen());
      });

      it("should not reprompt when delay is not reached", async () => {
        const { tryTriggerDrawer, user } = await setup({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: false,
        });

        await tryTriggerDrawer();
        const maybeLaterButton = screen.getByText(/maybe later/i);
        await user.press(maybeLaterButton);
        await waitFor(() => expect(maybeLaterButton).not.toBeOnTheScreen());

        advanceTime({ days: REPROMPT_SCHEDULE[0].days / 99 });
        await tryTriggerDrawer();
        expect(screen.queryByText(/maybe later/i)).not.toBeOnTheScreen();
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

        advanceTime({ days: REPROMPT_SCHEDULE[0].days / 99 });
        await tryTriggerDrawer();
        expect(screen.queryByText(/maybe later/i)).not.toBeOnTheScreen();
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

        advanceTime(REPROMPT_SCHEDULE[0]);
        await tryTriggerDrawer();
        await waitFor(() => expect(screen.getByText(/maybe later/i)).toBeOnTheScreen());
        expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
        await user.press(screen.getByTestId("drawer-backdrop"));
        await waitFor(() => expect(screen.queryByTestId("drawer-backdrop")).not.toBeOnTheScreen());

        advanceTime({ days: REPROMPT_SCHEDULE[1].days / 99 });
        await tryTriggerDrawer();
        expect(screen.queryByText(/maybe later/i)).not.toBeOnTheScreen();
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

        advanceTime({ days: REPROMPT_SCHEDULE[1].days / 99 });
        await tryTriggerDrawer();
        expect(screen.queryByText(/maybe later/i)).not.toBeOnTheScreen();
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

        advanceTime(REPROMPT_SCHEDULE[1]);
        await tryTriggerDrawer();
        await waitFor(() => expect(screen.getByText(/maybe later/i)).toBeOnTheScreen());
        expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
      });
    });
  });

  describe("after inactivity", () => {
    describe("backward compatibility", () => {
      describe("opt in", () => {
        it("alreadyDelayedToLater: should never prompt", async () => {
          const { user } = await setup({
            osPermission: AuthorizationStatus.AUTHORIZED,
            appNotifications: true,
            alreadyDelayedToLater: true,
          });

          act(() => jest.runOnlyPendingTimers());
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

          advanceTime(INACTIVITY_REPROMPT);
          await user.press(screen.getByText(/reload app/i));
          act(() => jest.runOnlyPendingTimers());
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

          advanceTime(INACTIVITY_REPROMPT);
          await user.press(screen.getByText(/reload app/i));
          act(() => jest.runOnlyPendingTimers());
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
        });

        it("dateOfNextAllowedRequest: should never prompt", async () => {
          const { user } = await setup({
            osPermission: AuthorizationStatus.AUTHORIZED,
            appNotifications: true,
            dateOfNextAllowedRequest: sub(new Date(), { years: 10 }),
          });

          act(() => jest.runOnlyPendingTimers());
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

          advanceTime(INACTIVITY_REPROMPT);
          await user.press(screen.getByText(/reload app/i));
          act(() => jest.runOnlyPendingTimers());
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

          advanceTime(INACTIVITY_REPROMPT);
          await user.press(screen.getByText(/reload app/i));
          act(() => jest.runOnlyPendingTimers());
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
        });
      });

      describe("opt out", () => {
        it("alreadyDelayedToLater: should prompt after inactivity", async () => {
          const { user } = await setup({
            osPermission: AuthorizationStatus.AUTHORIZED,
            appNotifications: false,
            alreadyDelayedToLater: true,
          });

          act(() => jest.runOnlyPendingTimers());
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

          advanceTime(INACTIVITY_REPROMPT);
          await user.press(screen.getByText(/reload app/i));
          act(() => jest.runOnlyPendingTimers());
          expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
        });

        it("dateOfNextAllowedRequest: should prompt after inactivity", async () => {
          const { user } = await setup({
            osPermission: AuthorizationStatus.AUTHORIZED,
            appNotifications: false,
            dateOfNextAllowedRequest: sub(new Date(), { years: 10 }),
          });

          act(() => jest.runOnlyPendingTimers());
          expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

          advanceTime(INACTIVITY_REPROMPT);
          await user.press(screen.getByText(/reload app/i));
          act(() => jest.runOnlyPendingTimers());
          expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
        });
      });
    });

    it("should prompt after inactivity", async () => {
      await setup({
        osPermission: AuthorizationStatus.AUTHORIZED,
        appNotifications: false,
        lastActionAt: sub(Date.now(), INACTIVITY_REPROMPT).getTime(),
      });

      act(() => jest.runOnlyPendingTimers());
      expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
    });

    it("should not prompt drawer if user is not inactive enough", async () => {
      await setup({
        osPermission: AuthorizationStatus.AUTHORIZED,
        appNotifications: false,
        lastActionAt: sub(Date.now(), { months: INACTIVITY_REPROMPT.months / 2 }).getTime(),
      });

      act(() => jest.runOnlyPendingTimers());
      expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
    });

    it("should not prompt if user is already opted in", async () => {
      await setup({
        osPermission: AuthorizationStatus.AUTHORIZED,
        appNotifications: true,
        lastActionAt: sub(Date.now(), INACTIVITY_REPROMPT).getTime(),
      });

      act(() => jest.runOnlyPendingTimers());
      expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
    });

    it("should only prompt drawer when the user becomes inactive", async () => {
      const { user } = await setup({
        osPermission: AuthorizationStatus.AUTHORIZED,
        appNotifications: false,
        lastActionAt: Date.now(),
      });

      act(() => jest.runOnlyPendingTimers());
      expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

      advanceTime(INACTIVITY_REPROMPT);
      await user.press(screen.getByText(/reload app/i));
      act(() => jest.runOnlyPendingTimers());
      await waitFor(() => {
        expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
      });
    });

    it("should stop prompting drawer after user opts in notifications", async () => {
      const { user } = await setup({
        osPermission: AuthorizationStatus.NOT_DETERMINED,
        appNotifications: true,
        lastActionAt: sub(Date.now(), INACTIVITY_REPROMPT).getTime(),
      });
      mockRequestPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
      mockHasPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);

      act(() => jest.runOnlyPendingTimers());
      const allowNotificationsButton = await screen.findByText(/allow notifications/i);
      expect(allowNotificationsButton).toBeOnTheScreen();

      await user.press(allowNotificationsButton);
      await waitFor(() => expect(allowNotificationsButton).not.toBeOnTheScreen());

      advanceTime(INACTIVITY_REPROMPT);
      await user.press(screen.getByText(/reload app/i));
      act(() => jest.runOnlyPendingTimers());
      expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

      advanceTime({ months: INACTIVITY_REPROMPT.months * 999 });
      await user.press(screen.getByText(/reload app/i));
      act(() => jest.runOnlyPendingTimers());
      expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
    });

    it("should stop prompting drawer after user is redirected to settings and opts in notifications", async () => {
      const firstAppRender = await setup({
        osPermission: AuthorizationStatus.DENIED,
        appNotifications: true,
        lastActionAt: sub(Date.now(), INACTIVITY_REPROMPT).getTime(),
      });

      act(() => jest.runOnlyPendingTimers());
      const allowNotificationsButton = await screen.findByText(/allow notifications/i);
      expect(allowNotificationsButton).toBeOnTheScreen();
      await firstAppRender.user.press(allowNotificationsButton);
      await waitFor(() => expect(allowNotificationsButton).not.toBeOnTheScreen());

      // Simulate the app being closed and reopened after the user opts in notifications
      await firstAppRender.unmountAsync();
      const secondAppRender = await setup({
        osPermission: AuthorizationStatus.AUTHORIZED,
        appNotifications: true,
      });

      advanceTime(INACTIVITY_REPROMPT);
      act(() => jest.runOnlyPendingTimers());
      expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

      advanceTime({ months: INACTIVITY_REPROMPT.months * 999 });
      await secondAppRender.user.press(screen.getByText(/reload app/i));
      act(() => jest.runOnlyPendingTimers());
      expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
    });

    describe("with action reprompt logic", () => {
      it("should not affect the action reprompt logic when user dismisses the opt in drawer from inactivity", async () => {
        const { tryTriggerDrawer, user } = await setup({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: false,
          lastActionAt: sub(Date.now(), INACTIVITY_REPROMPT).getTime(),
        });

        act(() => jest.runOnlyPendingTimers());
        const maybeLaterButton = screen.getByText(/maybe later/i);
        await user.press(maybeLaterButton);
        expect(maybeLaterButton).not.toBeOnTheScreen();

        advanceTime(INACTIVITY_REPROMPT);
        await user.press(screen.getByText(/reload app/i));
        act(() => jest.runOnlyPendingTimers());
        const backdrop = await screen.getByTestId("drawer-backdrop");
        await user.press(backdrop);
        expect(backdrop).not.toBeOnTheScreen();

        // User has never seen the opt in drawer after an action, so we should prompt it.
        await tryTriggerDrawer();
        expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
        await user.press(screen.getByText(/maybe later/i));

        // We have dismissed the opt in drawer from inactivity 2 times.
        // And once from an action.
        // So the first reprompt delay for an action should be applied (7 days).
        advanceTime(REPROMPT_SCHEDULE[0]);
        await tryTriggerDrawer();
        expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
      });

      it("should restart inactivity timer when the user opts out of notifications after an action", async () => {
        const { tryTriggerDrawer, user } = await setup({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: false,
          lastActionAt: sub(Date.now(), { months: INACTIVITY_REPROMPT.months / 2 }).getTime(), // 3 months ago
        });

        // User is not inactive enough yet (only 3 months, needs 6)
        act(() => jest.runOnlyPendingTimers());
        expect(screen.queryByText(/maybe later/i)).not.toBeOnTheScreen();

        // User triggers drawer after an action and opts out
        // This updates lastActionAt to NOW, restarting the inactivity timer
        await tryTriggerDrawer();
        const maybeLaterButton = screen.getByText(/maybe later/i);
        expect(maybeLaterButton).toBeOnTheScreen();
        await user.press(maybeLaterButton);
        expect(maybeLaterButton).not.toBeOnTheScreen();

        // Advance 3 more months (total 6 from original, but only 3 from opt-out)
        // User should NOT be inactive yet (needs 6 months from opt-out time)
        advanceTime({ months: INACTIVITY_REPROMPT.months / 2 });
        await user.press(screen.getByText(/reload app/i));
        act(() => jest.runOnlyPendingTimers());
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();

        // Advance another 3 months (6 months from opt-out time)
        // User should NOW be inactive and see the prompt
        advanceTime({ months: INACTIVITY_REPROMPT.months / 2 });
        await user.press(screen.getByText(/reload app/i));
        act(() => jest.runOnlyPendingTimers());
        expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
      });
    });
  });

  describe("A/B test", () => {
    describe("variant A (legacy)", () => {
      it("should show drawer after onboarding action", async () => {
        const { tryTriggerDrawer } = await setup({
          osPermission: AuthorizationStatus.NOT_DETERMINED,
          appNotifications: false,
          variant: ABTestingVariants.variantA,
        });

        await tryTriggerDrawer();
        expect(screen.getByText(/allow notifications/i)).toBeOnTheScreen();
      });

      it("should never show drawer after non-onboarding actions", async () => {
        const { tryTriggerDrawer } = await setup({
          actionSource: "add_favorite_coin",
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: false,
          variant: ABTestingVariants.variantA,
        });

        await tryTriggerDrawer();
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
      });

      it("should never show drawer after inactivity", async () => {
        await setup({
          osPermission: AuthorizationStatus.AUTHORIZED,
          appNotifications: false,
          lastActionAt: sub(Date.now(), INACTIVITY_REPROMPT).getTime(),
          variant: ABTestingVariants.variantA,
        });

        act(() => jest.runOnlyPendingTimers());
        expect(screen.queryByText(/allow notifications/i)).not.toBeOnTheScreen();
      });
    });
  });
});
