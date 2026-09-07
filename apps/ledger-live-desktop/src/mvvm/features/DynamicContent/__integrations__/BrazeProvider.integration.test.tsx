import { UserId, initialIdentitiesState } from "@domain/entity-client-identity";
import * as braze from "@braze/web-sdk";
import React, { useEffect } from "react";
import { act, render, withFlagOverrides } from "tests/testSetup";
import { setShareAnalytics } from "~/renderer/actions/settings";
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
});
