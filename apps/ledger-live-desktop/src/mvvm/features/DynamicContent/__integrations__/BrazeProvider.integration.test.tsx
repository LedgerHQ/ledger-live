import {
  DUMMY_ID_STR,
  UserId,
  identitiesSlice,
  initialIdentitiesState,
} from "@domain/entity-client-identity";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { DeviceModelId } from "@ledgerhq/devices";
import { BRAZE_CONTENT_CARDS_REFRESH_TIMEOUT_MS } from "@ledgerhq/live-common/braze/identityLifecycle";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import * as braze from "@braze/web-sdk";
import React, { useEffect } from "react";
import { act, render, withFlagOverrides } from "tests/testSetup";
import { replaceAccounts } from "~/renderer/actions/accounts";
import { saveSettings, setDeveloperMode, setShareAnalytics } from "~/renderer/actions/settings";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { LocationContentCard, Platform } from "~/types/dynamicContent";
import { BrazeProvider, useBraze } from "../components/BrazeProvider";

const mockedInitialize = jest.mocked(braze.initialize);
const mockedChangeUser = jest.mocked(braze.changeUser);
const mockedWipeData = jest.mocked(braze.wipeData);
const mockedEnableSDK = jest.mocked(braze.enableSDK);
const mockedRequestContentCardsRefresh = jest.mocked(braze.requestContentCardsRefresh);
const mockedSubscribeToContentCardsUpdates = jest.mocked(braze.subscribeToContentCardsUpdates);
const mockedRemoveSubscription = jest.mocked(braze.removeSubscription);
const mockedAutomaticallyShowInAppMessages = jest.mocked(braze.automaticallyShowInAppMessages);
const mockedOpenSession = jest.mocked(braze.openSession);

const REAL_USER_ID = UserId.fromString("11111111-1111-1111-1111-111111111111");
const resolvedRefresh = () => Promise.resolve();

type BrazeLifecycle = ReturnType<typeof useBraze>;
const defaultLifecycle: BrazeLifecycle = {
  prepareForIdentityTransition: () => {},
  refreshContentCards: resolvedRefresh,
  lastFetchedCards: null,
  eligibilityEvaluations: [],
  eligibilityContext: { hasFunds: false, isOnboarded: false, hasStax: false },
  injectDebugContentCard: () => {},
};

const desktopCard = {
  id: "wallet-card",
  extras: { location: LocationContentCard.Portfolio, platform: Platform.Desktop },
};

const mockContentCards = (cards: object[]): braze.ContentCards =>
  ({
    cards,
    lastUpdated: new Date(),
    getUnviewedCardCount: () => 0,
  }) as braze.ContentCards;

function RefreshConsumer({ onReady }: { onReady: (lifecycle: BrazeLifecycle) => void }) {
  const lifecycle = useBraze();
  useEffect(() => {
    onReady(lifecycle);
  }, [lifecycle, onReady]);
  return null;
}

function renderProvider(ui: React.ReactElement, { isTrackedUser }: { isTrackedUser: boolean }) {
  return render(ui, {
    initialState: {
      ...withFlagOverrides({ brazeOptOutIdentityCleanup: { enabled: true } }),
      identities: {
        ...initialIdentitiesState,
        userId: REAL_USER_ID,
      },
      settings: {
        ...INITIAL_STATE,
        shareAnalytics: isTrackedUser,
        sharePersonalizedRecommandations: false,
        dismissedContentCards: {},
        anonymousUserNotifications: {},
      },
    },
  });
}

describe("BrazeProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedInitialize.mockReturnValue(true);
    mockedSubscribeToContentCardsUpdates.mockReturnValue("subscription-id");
  });

  it("should mount the SDK once and identify the tracked user", async () => {
    const { unmount } = renderProvider(
      <BrazeProvider>
        <div />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedInitialize).toHaveBeenCalledTimes(1);
    expect(mockedChangeUser).toHaveBeenCalledTimes(1);
    expect(mockedChangeUser).toHaveBeenCalledWith(REAL_USER_ID.exportUserIdForBraze());
    expect(mockedChangeUser.mock.invocationCallOrder[0]).toBeLessThan(
      mockedOpenSession.mock.invocationCallOrder[0],
    );
    expect(mockedSubscribeToContentCardsUpdates).toHaveBeenCalledTimes(1);
    expect(mockedRequestContentCardsRefresh).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("should update Redux only after the Braze refresh signal", async () => {
    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <div />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(store.getState().dynamicContent.portfolioCards).toEqual([]);

    const onContentCardsUpdated = mockedSubscribeToContentCardsUpdates.mock.calls[0][0];
    await act(async () => {
      onContentCardsUpdated(mockContentCards([desktopCard]));
    });

    expect(store.getState().dynamicContent.portfolioCards).toEqual([
      expect.objectContaining({ id: "wallet-card" }),
    ]);
    unmount();
  });

  it("should reject a refresh when Braze does not emit a content cards update", async () => {
    const nativeSetTimeout = global.setTimeout.bind(global);
    const nativeClearTimeout = global.clearTimeout.bind(global);
    const refreshTimeouts = new Map<object, () => void>();
    const setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(((
      handler: TimerHandler,
      delay?: number,
      ...args: unknown[]
    ) => {
      if (delay !== BRAZE_CONTENT_CARDS_REFRESH_TIMEOUT_MS) {
        return nativeSetTimeout(handler as never, delay, ...args);
      }

      const timeoutId = {};
      refreshTimeouts.set(timeoutId, () => {
        if (typeof handler === "function") {
          handler(...args);
        }
      });
      return timeoutId as ReturnType<typeof setTimeout>;
    }) as unknown as typeof setTimeout);
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout").mockImplementation(timeoutId => {
      if (refreshTimeouts.delete(timeoutId as object)) {
        return;
      }
      nativeClearTimeout(timeoutId);
    });

    try {
      let lifecycle = defaultLifecycle;
      const { unmount } = renderProvider(
        <BrazeProvider>
          <RefreshConsumer
            onReady={value => {
              lifecycle = value;
            }}
          />
        </BrazeProvider>,
        { isTrackedUser: true },
      );

      await act(async () => {
        await Promise.resolve();
      });

      const refreshPromise = lifecycle.refreshContentCards();

      await act(async () => {
        for (const fireTimeout of refreshTimeouts.values()) {
          fireTimeout();
        }
      });
      await expect(refreshPromise).rejects.toThrow(
        "Timed out waiting for Braze content cards refresh",
      );

      unmount();
    } finally {
      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    }
  });

  it("should run the shared identity lifecycle on opt-out without stacking a new session from init deps", async () => {
    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <div />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });
    mockedInitialize.mockClear();
    mockedChangeUser.mockClear();
    mockedRequestContentCardsRefresh.mockClear();

    await act(async () => {
      store.dispatch(setShareAnalytics(false));
    });

    expect(mockedInitialize).toHaveBeenCalledTimes(1);
    expect(mockedWipeData).toHaveBeenCalledTimes(1);
    expect(mockedEnableSDK).toHaveBeenCalledTimes(1);
    expect(mockedChangeUser).not.toHaveBeenCalled();
    expect(mockedRemoveSubscription).toHaveBeenCalledTimes(1);
    expect(mockedSubscribeToContentCardsUpdates).toHaveBeenCalledTimes(2);
    expect(mockedRequestContentCardsRefresh).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("should ignore pre-wipe events and issue a new refresh after an identity reset", async () => {
    let lifecycle = defaultLifecycle;
    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <RefreshConsumer
          onReady={value => {
            lifecycle = value;
          }}
        />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });

    const preWipeListener = mockedSubscribeToContentCardsUpdates.mock.calls[0][0];
    mockedSubscribeToContentCardsUpdates.mockReturnValue("subscription-id-2");

    lifecycle.prepareForIdentityTransition();
    const postWipeRefresh = lifecycle.refreshContentCards();

    expect(mockedRequestContentCardsRefresh).toHaveBeenCalledTimes(2);

    await act(async () => {
      preWipeListener(mockContentCards([desktopCard]));
    });

    expect(store.getState().dynamicContent.portfolioCards).toEqual([]);

    const postWipeListener = mockedSubscribeToContentCardsUpdates.mock.calls[1][0];
    await act(async () => {
      postWipeListener(mockContentCards([desktopCard]));
      await postWipeRefresh;
    });

    expect(store.getState().dynamicContent.portfolioCards).toEqual([
      expect.objectContaining({ id: "wallet-card" }),
    ]);
    unmount();
  });

  it("should apply the latest consent when it flips back while opt-out is in flight", async () => {
    let completeWipe: () => void = () => {};
    mockedWipeData.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          completeWipe = resolve;
        }),
    );

    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <div />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });
    mockedChangeUser.mockClear();
    mockedRequestContentCardsRefresh.mockClear();
    mockedEnableSDK.mockClear();

    await act(async () => {
      store.dispatch(setShareAnalytics(false));
    });

    expect(mockedWipeData).toHaveBeenCalledTimes(1);
    expect(mockedEnableSDK).not.toHaveBeenCalled();

    await act(async () => {
      store.dispatch(setShareAnalytics(true));
    });

    expect(mockedWipeData).toHaveBeenCalledTimes(1);
    expect(mockedChangeUser).not.toHaveBeenCalled();

    mockedSubscribeToContentCardsUpdates.mockReturnValue("subscription-id-2");

    await act(async () => {
      completeWipe();
    });

    expect(mockedEnableSDK).toHaveBeenCalledTimes(1);
    expect(mockedRequestContentCardsRefresh).toHaveBeenCalledTimes(1);
    expect(mockedChangeUser).not.toHaveBeenCalled();

    const postWipeListener = mockedSubscribeToContentCardsUpdates.mock.calls.at(-1)?.[0];
    expect(postWipeListener).toEqual(expect.any(Function));

    await act(async () => {
      postWipeListener?.(mockContentCards([]));
      await Promise.resolve();
    });

    expect(mockedWipeData).toHaveBeenCalledTimes(2);
    expect(mockedChangeUser).toHaveBeenCalledTimes(1);
    expect(mockedChangeUser).toHaveBeenCalledWith(REAL_USER_ID.exportUserIdForBraze());
    unmount();
  });

  it("should re-apply opt-in after a failed opt-out when consent flips back", async () => {
    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <div />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });
    mockedChangeUser.mockClear();
    mockedWipeData.mockClear();
    mockedEnableSDK.mockClear();
    mockedRequestContentCardsRefresh.mockClear();
    mockedWipeData.mockImplementationOnce(() => {
      throw new Error("wipe failed");
    });

    await act(async () => {
      store.dispatch(setShareAnalytics(false));
      await Promise.resolve();
      await Promise.resolve();
    });

    mockedSubscribeToContentCardsUpdates.mockReturnValue("subscription-id-failed-opt-out");

    await act(async () => {
      store.dispatch(setShareAnalytics(true));
      await Promise.resolve();
      await Promise.resolve();
    });

    const latestListener = mockedSubscribeToContentCardsUpdates.mock.calls.at(-1)?.[0];
    await act(async () => {
      latestListener?.(mockContentCards([]));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedWipeData).toHaveBeenCalled();
    expect(mockedEnableSDK).toHaveBeenCalled();
    expect(mockedChangeUser).toHaveBeenCalledWith(REAL_USER_ID.exportUserIdForBraze());

    unmount();
  });

  it("should retry the consent transition when SDK re-initialization fails", async () => {
    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <div />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });
    mockedInitialize.mockClear();
    mockedWipeData.mockClear();
    mockedEnableSDK.mockClear();
    mockedAutomaticallyShowInAppMessages.mockClear();
    mockedOpenSession.mockClear();
    mockedInitialize.mockReturnValueOnce(false).mockReturnValue(true);

    await act(async () => {
      store.dispatch(setShareAnalytics(false));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedInitialize).toHaveBeenCalledTimes(2);
    expect(mockedWipeData).toHaveBeenCalledTimes(2);
    expect(mockedEnableSDK).toHaveBeenCalledTimes(2);
    expect(mockedAutomaticallyShowInAppMessages).toHaveBeenCalledTimes(1);
    expect(mockedOpenSession).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("should tear down the session when the user id becomes dummy and reopen it for the next real user", async () => {
    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <div />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedOpenSession).toHaveBeenCalledTimes(1);

    const onContentCardsUpdated = mockedSubscribeToContentCardsUpdates.mock.calls[0][0];
    await act(async () => {
      onContentCardsUpdated(mockContentCards([desktopCard]));
    });
    expect(store.getState().dynamicContent.portfolioCards).toEqual([
      expect.objectContaining({ id: "wallet-card" }),
    ]);

    mockedChangeUser.mockClear();
    mockedOpenSession.mockClear();
    mockedRemoveSubscription.mockClear();
    mockedSubscribeToContentCardsUpdates.mockReturnValue("subscription-id-2");

    await act(async () => {
      store.dispatch(identitiesSlice.actions.importFromLegacy({ userId: DUMMY_ID_STR }));
    });

    expect(mockedRemoveSubscription).toHaveBeenCalledTimes(1);
    expect(mockedChangeUser).not.toHaveBeenCalled();
    expect(mockedOpenSession).not.toHaveBeenCalled();
    expect(store.getState().dynamicContent.portfolioCards).toEqual([]);

    await act(async () => {
      store.dispatch(
        identitiesSlice.actions.importFromLegacy({
          userId: REAL_USER_ID.exportUserIdForPersistence(),
        }),
      );
    });

    expect(mockedChangeUser).toHaveBeenCalledTimes(1);
    expect(mockedChangeUser).toHaveBeenCalledWith(REAL_USER_ID.exportUserIdForBraze());
    expect(mockedOpenSession).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("should not identify the previous user when logout happens during an in-flight opt-in", async () => {
    let completeWipe: () => void = () => {};
    mockedWipeData.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          completeWipe = resolve;
        }),
    );

    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <div />
      </BrazeProvider>,
      { isTrackedUser: false },
    );

    await act(async () => {
      await Promise.resolve();
    });
    mockedChangeUser.mockClear();
    mockedEnableSDK.mockClear();

    await act(async () => {
      store.dispatch(setShareAnalytics(true));
    });

    expect(mockedWipeData).toHaveBeenCalledTimes(1);
    expect(mockedChangeUser).not.toHaveBeenCalled();

    await act(async () => {
      store.dispatch(identitiesSlice.actions.importFromLegacy({ userId: DUMMY_ID_STR }));
    });

    await act(async () => {
      completeWipe();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedChangeUser).not.toHaveBeenCalled();
    expect(mockedEnableSDK).not.toHaveBeenCalled();
    unmount();
  });

  it("should re-initialize the SDK with live consent when developer mode changes", async () => {
    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <div />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      store.dispatch(setShareAnalytics(false));
      await Promise.resolve();
      await Promise.resolve();
    });

    mockedInitialize.mockClear();

    await act(async () => {
      store.dispatch(setDeveloperMode(true));
    });

    expect(mockedInitialize).toHaveBeenCalledTimes(1);
    expect(mockedInitialize).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        sessionTimeoutInSeconds: 1,
        appVersion: undefined,
      }),
    );
    unmount();
  });

  it("should publish cards that have no required states", async () => {
    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <div />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });

    const onContentCardsUpdated = mockedSubscribeToContentCardsUpdates.mock.calls[0][0];
    await act(async () => {
      onContentCardsUpdated(mockContentCards([desktopCard]));
    });

    expect(store.getState().dynamicContent.desktopCards).toEqual([
      expect.objectContaining({ id: "wallet-card" }),
    ]);
    unmount();
  });

  it("should keep unmet requiredStates cards out of Redux", async () => {
    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <div />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });

    const onContentCardsUpdated = mockedSubscribeToContentCardsUpdates.mock.calls[0][0];
    await act(async () => {
      onContentCardsUpdated(
        mockContentCards([
          {
            ...desktopCard,
            extras: { ...desktopCard.extras, requiredStates: "hasStax" },
          },
        ]),
      );
    });

    expect(store.getState().dynamicContent.desktopCards).toEqual([]);
    unmount();
  });

  it("should re-evaluate cached cards when app eligibility changes without another refresh", async () => {
    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <div />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });

    const onContentCardsUpdated = mockedSubscribeToContentCardsUpdates.mock.calls[0][0];
    await act(async () => {
      onContentCardsUpdated(
        mockContentCards([
          {
            id: "onboard-card",
            extras: {
              location: LocationContentCard.Portfolio,
              platform: Platform.Desktop,
              requiredStates: "isOnboarded",
            },
          },
          {
            id: "stax-card",
            extras: {
              location: LocationContentCard.Portfolio,
              platform: Platform.Desktop,
              requiredStates: "hasStax",
            },
          },
          {
            id: "funds-card",
            extras: {
              location: LocationContentCard.Portfolio,
              platform: Platform.Desktop,
              requiredStates: "hasFunds",
            },
          },
        ]),
      );
    });

    expect(store.getState().dynamicContent.desktopCards).toEqual([]);
    const refreshCountAfterFetch = mockedRequestContentCardsRefresh.mock.calls.length;

    await act(async () => {
      store.dispatch(saveSettings({ hasCompletedOnboarding: true }));
    });
    expect(store.getState().dynamicContent.desktopCards.map(card => card.id)).toEqual([
      "onboard-card",
    ]);

    await act(async () => {
      store.dispatch(saveSettings({ devicesModelList: [DeviceModelId.stax] }));
    });
    expect(store.getState().dynamicContent.desktopCards.map(card => card.id)).toEqual([
      "onboard-card",
      "stax-card",
    ]);

    await act(async () => {
      store.dispatch(
        replaceAccounts([
          genAccount("funded-eth", {
            currency: getCryptoCurrencyById("ethereum"),
            operationsSize: 1,
          }),
        ]),
      );
    });
    expect(store.getState().dynamicContent.desktopCards.map(card => card.id)).toEqual([
      "onboard-card",
      "stax-card",
      "funds-card",
    ]);
    expect(mockedRequestContentCardsRefresh).toHaveBeenCalledTimes(refreshCountAfterFetch);
    unmount();
  });

  it("should not re-publish the last fetch after dummy identity clears the cache", async () => {
    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <div />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });

    const onContentCardsUpdated = mockedSubscribeToContentCardsUpdates.mock.calls[0][0];
    await act(async () => {
      onContentCardsUpdated(mockContentCards([desktopCard]));
    });
    expect(store.getState().dynamicContent.desktopCards).toEqual([
      expect.objectContaining({ id: "wallet-card" }),
    ]);

    await act(async () => {
      store.dispatch(identitiesSlice.actions.importFromLegacy({ userId: DUMMY_ID_STR }));
    });
    expect(store.getState().dynamicContent.desktopCards).toEqual([]);

    await act(async () => {
      store.dispatch(saveSettings({ hasCompletedOnboarding: true }));
    });
    expect(store.getState().dynamicContent.desktopCards).toEqual([]);
    unmount();
  });

  it("should expose eligibility context matching onboarding, Stax, and funded accounts", async () => {
    let lifecycle = defaultLifecycle;
    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <RefreshConsumer
          onReady={value => {
            lifecycle = value;
          }}
        />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(lifecycle.eligibilityContext).toEqual({
      hasFunds: false,
      isOnboarded: false,
      hasStax: false,
    });

    await act(async () => {
      store.dispatch(
        saveSettings({
          hasCompletedOnboarding: true,
          devicesModelList: [DeviceModelId.stax],
        }),
      );
      store.dispatch(
        replaceAccounts([
          genAccount("funded-eth", {
            currency: getCryptoCurrencyById("ethereum"),
            operationsSize: 1,
          }),
        ]),
      );
    });

    expect(lifecycle.eligibilityContext).toEqual({
      hasFunds: true,
      isOnboarded: true,
      hasStax: true,
    });
    unmount();
  });

  it("should expose blockedBy evaluations for unmet requiredStates without publishing the card", async () => {
    let lifecycle = defaultLifecycle;
    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <RefreshConsumer
          onReady={value => {
            lifecycle = value;
          }}
        />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });

    const onContentCardsUpdated = mockedSubscribeToContentCardsUpdates.mock.calls[0][0];
    await act(async () => {
      onContentCardsUpdated(
        mockContentCards([
          {
            id: "portfolio-blocked",
            extras: {
              location: LocationContentCard.Portfolio,
              platform: Platform.Desktop,
              requiredStates: "hasStax",
            },
          },
          {
            id: "action-blocked",
            extras: {
              location: LocationContentCard.Action,
              platform: Platform.Desktop,
              requiredStates: "hasStax",
            },
          },
          {
            id: "gam-blocked",
            extras: {
              location: LocationContentCard.GenericAwarenessModal,
              platform: Platform.Desktop,
              requiredStates: "hasStax",
            },
          },
          {
            id: "notification-blocked",
            extras: {
              location: LocationContentCard.NotificationCenter,
              platform: Platform.Desktop,
              requiredStates: "hasStax",
            },
          },
        ]),
      );
    });

    expect(lifecycle.lastFetchedCards).toHaveLength(4);
    expect(lifecycle.eligibilityEvaluations).toEqual(
      expect.arrayContaining([
        {
          id: "portfolio-blocked",
          requiredStates: ["hasStax"],
          result: { eligible: false, blockedBy: "hasStax", reason: "unmet-state" },
        },
      ]),
    );
    expect(store.getState().dynamicContent.portfolioCards).toEqual([]);
    expect(store.getState().dynamicContent.actionCards).toEqual([]);
    expect(store.getState().genericAwarenessModal.contentCards).toEqual([]);
    expect(store.getState().dynamicContent.notificationsCards).toEqual([]);
    unmount();
  });

  it("should filter an injected debug card with requiredStates the same as a Braze fetch", async () => {
    let lifecycle = defaultLifecycle;
    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <RefreshConsumer
          onReady={value => {
            lifecycle = value;
          }}
        />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });

    const refreshCountBeforeInject = mockedRequestContentCardsRefresh.mock.calls.length;
    await act(async () => {
      lifecycle.injectDebugContentCard({
        id: "debug-stax",
        extras: {
          location: LocationContentCard.Portfolio,
          requiredStates: "hasStax",
          title: "Debug Stax",
        },
      });
    });

    expect(lifecycle.eligibilityEvaluations).toEqual([
      {
        id: "debug-stax",
        requiredStates: ["hasStax"],
        result: { eligible: false, blockedBy: "hasStax", reason: "unmet-state" },
      },
    ]);
    expect(store.getState().dynamicContent.portfolioCards).toEqual([]);
    expect(mockedRequestContentCardsRefresh).toHaveBeenCalledTimes(refreshCountBeforeInject);

    await act(async () => {
      store.dispatch(saveSettings({ devicesModelList: [DeviceModelId.stax] }));
    });

    expect(store.getState().dynamicContent.portfolioCards).toEqual([
      expect.objectContaining({ id: "debug-stax" }),
    ]);
    expect(lifecycle.eligibilityEvaluations[0]?.result).toEqual({ eligible: true });
    expect(mockedRequestContentCardsRefresh).toHaveBeenCalledTimes(refreshCountBeforeInject);
    unmount();
  });

  it("should not re-publish an injected debug fetch after dummy identity clears the cache", async () => {
    let lifecycle = defaultLifecycle;
    const { store, unmount } = renderProvider(
      <BrazeProvider>
        <RefreshConsumer
          onReady={value => {
            lifecycle = value;
          }}
        />
      </BrazeProvider>,
      { isTrackedUser: true },
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      lifecycle.injectDebugContentCard({
        id: "debug-onboard",
        extras: {
          location: LocationContentCard.Portfolio,
          requiredStates: "isOnboarded",
          title: "Debug onboard",
        },
      });
    });

    await act(async () => {
      store.dispatch(identitiesSlice.actions.importFromLegacy({ userId: DUMMY_ID_STR }));
    });

    expect(lifecycle.lastFetchedCards).toBeNull();
    expect(lifecycle.eligibilityEvaluations).toEqual([]);
    expect(store.getState().dynamicContent.desktopCards).toEqual([]);

    await act(async () => {
      store.dispatch(saveSettings({ hasCompletedOnboarding: true }));
    });

    expect(store.getState().dynamicContent.desktopCards).toEqual([]);
    expect(lifecycle.lastFetchedCards).toBeNull();
    unmount();
  });
});
