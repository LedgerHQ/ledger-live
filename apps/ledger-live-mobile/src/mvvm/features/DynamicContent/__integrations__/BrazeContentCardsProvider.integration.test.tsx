import Braze, { type ContentCard } from "@braze/react-native-sdk";
import { BRAZE_CONTENT_CARDS_REFRESH_TIMEOUT_MS } from "@ledgerhq/live-common/braze/identityLifecycle";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import { act, render } from "@tests/test-renderer";
import React, { useEffect } from "react";
import { addOneAccount } from "~/actions/accounts";
import { setDynamicContentNotificationCards } from "~/actions/dynamicContent";
import { completeOnboarding, unsafe_setKnownDeviceModelIds } from "~/actions/settings";
import { useSelector } from "~/context/hooks";
import { walletCardsSelector } from "~/reducers/dynamicContent";
import type { State } from "~/reducers/types";
import {
  BrazeContentCardsProvider,
  useBrazeContentCards,
} from "../components/BrazeContentCardsProvider";

const FUNDED_ACCOUNT = genAccount("braze-eligibility-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 3,
});

const mockedAddListener = jest.mocked(Braze.addListener);
const mockedRequestContentCardsRefresh = jest.mocked(Braze.requestContentCardsRefresh);
const resolvedRefresh = () => Promise.resolve();
type BrazeContentCardsLifecycle = ReturnType<typeof useBrazeContentCards>;
const defaultLifecycle: BrazeContentCardsLifecycle = {
  prepareForIdentityTransition: () => {},
  refreshContentCards: resolvedRefresh,
  lastFetchedCards: null,
  eligibilityEvaluations: [],
  eligibilityContext: { hasFunds: false, isOnboarded: false, hasStax: false },
};

const contentCard: ContentCard = {
  id: "wallet-card",
  created: 1_690_112_400,
  expiresAt: -1,
  viewed: false,
  clicked: false,
  pinned: false,
  dismissed: false,
  dismissible: true,
  openURLInWebView: true,
  isControl: false,
  extras: { location: "wallet", platform: "mobile" },
  type: "Classic",
  title: "Wallet card",
  cardDescription: "Wallet card description",
};

const notificationCard: ContentCard = {
  ...contentCard,
  id: "notification-card",
  title: "Notification card",
  extras: { location: "notification_center", platform: "mobile" },
};

const modalCard: ContentCard = {
  ...contentCard,
  id: "modal-card",
  extras: {
    platform: "mobile",
    location: "generic_awareness_modal",
    layout: GenericAwarenessModalLayout.Carousel,
    campaignId: "modal-campaign",
    index: "0",
    slideCount: "1",
    title: "Slide 1",
    subtitle: "First",
    imageUrlLight: "https://example.com/1.png",
    imageUrlDark: "",
    primaryButtonLabel: "Go",
    primaryButtonLink: "https://example.com",
    navigationButtonLabel: "Next",
  },
};

const copyCards = (cards: ContentCard[]) =>
  cards.map(card => ({ ...card, extras: { ...card.extras } }));

const withLocalModalCard = (state: State): State => ({
  ...state,
  genericAwarenessModal: {
    ...state.genericAwarenessModal,
    contentCards: [
      {
        id: "local-modal",
        layout: GenericAwarenessModalLayout.Carousel,
        data: [],
        isReady: true,
        isLocal: true,
      },
    ],
  },
});

function RefreshConsumer({
  onReady,
}: {
  onReady: (lifecycle: BrazeContentCardsLifecycle) => void;
}) {
  const lifecycle = useBrazeContentCards();
  useEffect(() => {
    onReady(lifecycle);
  }, [lifecycle, onReady]);
  return null;
}

function WalletCardsReader({ onRender }: { onRender: () => void }) {
  useSelector(walletCardsSelector);
  onRender();
  return null;
}

function ContentCardsContextReader({ onRender }: { onRender: () => void }) {
  useBrazeContentCards();
  onRender();
  return null;
}

const renderProvider = (
  children: React.ReactNode = <RefreshConsumer onReady={jest.fn()} />,
  options?: Parameters<typeof render>[1],
) => render(<BrazeContentCardsProvider>{children}</BrazeContentCardsProvider>, options);

const publish = async (cards: ContentCard[]) => {
  const onContentCardsUpdated = mockedAddListener.mock.calls[0][1] as unknown as (
    event: Braze.ContentCardsUpdatedEvent,
  ) => void;
  await act(async () => {
    onContentCardsUpdated({ cards });
  });
};

describe("BrazeContentCardsProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update Redux only after the Braze refresh signal", async () => {
    const onReady = jest.fn();
    const { store } = render(
      <BrazeContentCardsProvider>
        <RefreshConsumer onReady={onReady} />
      </BrazeContentCardsProvider>,
    );

    expect(mockedRequestContentCardsRefresh).toHaveBeenCalledTimes(1);
    expect(store.getState().dynamicContent.mobileCards).toEqual([]);

    const onContentCardsUpdated = mockedAddListener.mock.calls[0][1] as unknown as (
      event: Braze.ContentCardsUpdatedEvent,
    ) => void;

    await act(async () => {
      onContentCardsUpdated({ cards: [contentCard] });
    });

    expect(store.getState().dynamicContent.mobileCards).toEqual([contentCard]);
    expect(store.getState().dynamicContent.isLoading).toBe(false);
  });

  it("should coalesce refresh requests until Braze publishes an update", async () => {
    let refreshContentCards: () => Promise<void> = resolvedRefresh;
    render(
      <BrazeContentCardsProvider>
        <RefreshConsumer
          onReady={lifecycle => {
            refreshContentCards = lifecycle.refreshContentCards;
          }}
        />
      </BrazeContentCardsProvider>,
    );

    const firstRefresh = refreshContentCards();
    const secondRefresh = refreshContentCards();

    expect(firstRefresh).toBe(secondRefresh);
    expect(mockedRequestContentCardsRefresh).toHaveBeenCalledTimes(1);

    const onContentCardsUpdated = mockedAddListener.mock.calls[0][1] as unknown as (
      event: Braze.ContentCardsUpdatedEvent,
    ) => void;

    await act(async () => {
      onContentCardsUpdated({ cards: [] });
      await firstRefresh;
    });
  });

  it("should reject a hung refresh and ignore its late update", async () => {
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
      if (refreshTimeouts.delete(timeoutId as unknown as object)) {
        return;
      }
      nativeClearTimeout(timeoutId);
    });

    try {
      let lifecycle = defaultLifecycle;
      const { store, unmount } = render(
        <BrazeContentCardsProvider>
          <RefreshConsumer
            onReady={value => {
              lifecycle = value;
            }}
          />
        </BrazeContentCardsProvider>,
      );
      const staleListener = mockedAddListener.mock.calls[0][1] as unknown as (
        event: Braze.ContentCardsUpdatedEvent,
      ) => void;
      const refreshPromise = lifecycle.refreshContentCards();
      void refreshPromise.catch(() => {});

      await act(async () => {
        for (const fireTimeout of refreshTimeouts.values()) {
          fireTimeout();
        }
      });

      await expect(refreshPromise).rejects.toThrow(
        "Timed out waiting for Braze content cards refresh",
      );
      expect(store.getState().dynamicContent.isLoading).toBe(false);

      await act(async () => {
        staleListener({ cards: [contentCard] });
      });

      expect(store.getState().dynamicContent.mobileCards).toEqual([]);
      unmount();
    } finally {
      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    }
  });

  it("should ignore pre-wipe events and issue a new refresh after an identity reset", async () => {
    let lifecycle = defaultLifecycle;
    const { store } = render(
      <BrazeContentCardsProvider>
        <RefreshConsumer
          onReady={value => {
            lifecycle = value;
          }}
        />
      </BrazeContentCardsProvider>,
    );
    const preWipeListener = mockedAddListener.mock.calls[0][1] as unknown as (
      event: Braze.ContentCardsUpdatedEvent,
    ) => void;

    await act(async () => {
      lifecycle.prepareForIdentityTransition();
    });
    const postWipeRefresh = lifecycle.refreshContentCards();

    expect(mockedRequestContentCardsRefresh).toHaveBeenCalledTimes(2);

    await act(async () => {
      preWipeListener({ cards: [contentCard] });
    });

    expect(store.getState().dynamicContent.mobileCards).toEqual([]);

    const postWipeListener = mockedAddListener.mock.calls[1][1] as unknown as (
      event: Braze.ContentCardsUpdatedEvent,
    ) => void;
    await act(async () => {
      postWipeListener({ cards: [contentCard] });
      await postWipeRefresh;
    });

    expect(store.getState().dynamicContent.mobileCards).toEqual([contentCard]);
  });

  it("should clear cached cards and not republish them after an identity reset", async () => {
    let lifecycle = defaultLifecycle;
    const { store } = render(
      <BrazeContentCardsProvider>
        <RefreshConsumer
          onReady={value => {
            lifecycle = value;
          }}
        />
      </BrazeContentCardsProvider>,
    );
    const onContentCardsUpdated = mockedAddListener.mock.calls[0][1] as unknown as (
      event: Braze.ContentCardsUpdatedEvent,
    ) => void;

    await act(async () => {
      onContentCardsUpdated({ cards: [contentCard] });
    });

    expect(store.getState().dynamicContent.mobileCards).toEqual([contentCard]);
    expect(lifecycle.lastFetchedCards).toEqual([contentCard]);
    expect(lifecycle.eligibilityEvaluations).toHaveLength(1);

    await act(async () => {
      lifecycle.prepareForIdentityTransition();
    });

    expect(store.getState().dynamicContent.mobileCards).toEqual([]);
    expect(lifecycle.lastFetchedCards).toBeNull();
    expect(lifecycle.eligibilityEvaluations).toEqual([]);

    await act(async () => {
      store.dispatch(completeOnboarding());
    });

    expect(store.getState().dynamicContent.mobileCards).toEqual([]);
  });

  it("should keep ineligible cards out of Redux", async () => {
    const { store } = render(
      <BrazeContentCardsProvider>
        <RefreshConsumer onReady={jest.fn()} />
      </BrazeContentCardsProvider>,
    );

    const onContentCardsUpdated = mockedAddListener.mock.calls[0][1] as unknown as (
      event: Braze.ContentCardsUpdatedEvent,
    ) => void;
    const blockedCard: ContentCard = {
      ...contentCard,
      extras: { ...contentCard.extras, requiredStates: "hasStax" },
    };

    await act(async () => {
      onContentCardsUpdated({ cards: [blockedCard] });
    });

    expect(store.getState().dynamicContent.mobileCards).toEqual([]);
  });

  it("should re-evaluate eligibility when app state changes", async () => {
    const { store } = render(
      <BrazeContentCardsProvider>
        <RefreshConsumer onReady={jest.fn()} />
      </BrazeContentCardsProvider>,
    );

    const onContentCardsUpdated = mockedAddListener.mock.calls[0][1] as unknown as (
      event: Braze.ContentCardsUpdatedEvent,
    ) => void;
    const onboardedCard: ContentCard = {
      ...contentCard,
      extras: { ...contentCard.extras, requiredStates: "isOnboarded" },
    };

    await act(async () => {
      onContentCardsUpdated({ cards: [onboardedCard] });
    });

    expect(store.getState().dynamicContent.mobileCards).toEqual([]);

    await act(async () => {
      store.dispatch(completeOnboarding());
    });

    expect(store.getState().dynamicContent.mobileCards).toEqual([onboardedCard]);
  });

  it("should publish a hasStax card after Stax becomes known without another Braze event", async () => {
    const { store } = render(
      <BrazeContentCardsProvider>
        <RefreshConsumer onReady={jest.fn()} />
      </BrazeContentCardsProvider>,
    );

    const onContentCardsUpdated = mockedAddListener.mock.calls[0][1] as unknown as (
      event: Braze.ContentCardsUpdatedEvent,
    ) => void;
    const staxCard: ContentCard = {
      ...contentCard,
      extras: { ...contentCard.extras, requiredStates: "hasStax" },
    };

    await act(async () => {
      onContentCardsUpdated({ cards: [staxCard] });
    });

    expect(store.getState().dynamicContent.mobileCards).toEqual([]);

    await act(async () => {
      store.dispatch(unsafe_setKnownDeviceModelIds({ stax: true }));
    });

    expect(store.getState().dynamicContent.mobileCards).toEqual([staxCard]);
  });

  it("should publish a hasFunds card after a funded account is added without another Braze event", async () => {
    const { store } = render(
      <BrazeContentCardsProvider>
        <RefreshConsumer onReady={jest.fn()} />
      </BrazeContentCardsProvider>,
    );

    const onContentCardsUpdated = mockedAddListener.mock.calls[0][1] as unknown as (
      event: Braze.ContentCardsUpdatedEvent,
    ) => void;
    const fundsCard: ContentCard = {
      ...contentCard,
      extras: { ...contentCard.extras, requiredStates: "hasFunds" },
    };

    await act(async () => {
      onContentCardsUpdated({ cards: [fundsCard] });
    });

    expect(store.getState().dynamicContent.mobileCards).toEqual([]);

    await act(async () => {
      store.dispatch(addOneAccount(FUNDED_ACCOUNT));
    });

    expect(store.getState().dynamicContent.mobileCards).toEqual([fundsCard]);
  });
});

describe("BrazeContentCardsProvider when Braze republishes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ["empty card list", [] as ContentCard[]],
    ["cards", [contentCard, notificationCard, modalCard]],
  ])("should leave the store untouched when Braze republishes the same %s", async (_, cards) => {
    const { store } = renderProvider();
    await publish(copyCards(cards));
    const published = store.getState();
    const onStoreChange = jest.fn();
    const unsubscribe = store.subscribe(onStoreChange);

    await publish(copyCards(cards));
    unsubscribe();

    expect(onStoreChange).not.toHaveBeenCalled();
    expect(store.getState().dynamicContent).toBe(published.dynamicContent);
    expect(store.getState().genericAwarenessModal).toBe(published.genericAwarenessModal);
  });

  it("should end loading and keep every list when Braze publishes no cards to an empty store", async () => {
    const { store } = renderProvider();
    const before = store.getState();

    await publish([]);

    const { dynamicContent, genericAwarenessModal } = store.getState();
    expect(dynamicContent.isLoading).toBe(false);
    expect(dynamicContent.categoriesCards).toBe(before.dynamicContent.categoriesCards);
    expect(dynamicContent.mobileCards).toBe(before.dynamicContent.mobileCards);
    expect(dynamicContent.walletCards).toBe(before.dynamicContent.walletCards);
    expect(dynamicContent.assetsCards).toBe(before.dynamicContent.assetsCards);
    expect(dynamicContent.notificationCards).toBe(before.dynamicContent.notificationCards);
    expect(dynamicContent.landingPageStickyCtaCards).toBe(
      before.dynamicContent.landingPageStickyCtaCards,
    );
    expect(genericAwarenessModal).toBe(before.genericAwarenessModal);
  });

  it("should end loading without replacing any list when a refresh brings back the same cards", async () => {
    let lifecycle = defaultLifecycle;
    const { store } = renderProvider(
      <RefreshConsumer
        onReady={value => {
          lifecycle = value;
        }}
      />,
    );
    await publish([contentCard, notificationCard]);
    const stored = store.getState().dynamicContent;
    let refresh = resolvedRefresh();
    await act(async () => {
      refresh = lifecycle.refreshContentCards();
    });
    expect(store.getState().dynamicContent.isLoading).toBe(true);

    await publish(copyCards([contentCard, notificationCard]));
    await refresh;

    const refreshed = store.getState().dynamicContent;
    expect(refreshed.isLoading).toBe(false);
    expect(refreshed.walletCards).toBe(stored.walletCards);
    expect(refreshed.notificationCards).toBe(stored.notificationCards);
    expect(refreshed.mobileCards).toBe(stored.mobileCards);
  });

  it("should not re-render card readers when Braze republishes the same cards", async () => {
    const onWalletCardsRender = jest.fn();
    const onContextRender = jest.fn();
    renderProvider(
      <>
        <WalletCardsReader onRender={onWalletCardsRender} />
        <ContentCardsContextReader onRender={onContextRender} />
      </>,
    );
    await publish([contentCard]);
    onWalletCardsRender.mockClear();
    onContextRender.mockClear();

    await publish(copyCards([contentCard]));

    expect(onWalletCardsRender).not.toHaveBeenCalled();
    expect(onContextRender).not.toHaveBeenCalled();
  });

  it("should expose the new fetched cards when Braze changes a card", async () => {
    let lifecycle = defaultLifecycle;
    renderProvider(
      <RefreshConsumer
        onReady={value => {
          lifecycle = value;
        }}
      />,
    );
    await publish([contentCard]);
    const changedCards = [{ ...contentCard, title: "Updated wallet card" }];

    await publish(changedCards);

    expect(lifecycle.lastFetchedCards).toBe(changedCards);
  });

  it("should leave Braze lists untouched when an eligibility change keeps the same eligible cards", async () => {
    const { store } = renderProvider();
    await publish([contentCard]);
    const published = store.getState();

    await act(async () => {
      store.dispatch(addOneAccount(FUNDED_ACCOUNT));
    });

    expect(store.getState().dynamicContent).toBe(published.dynamicContent);
    expect(store.getState().genericAwarenessModal).toBe(published.genericAwarenessModal);
  });

  it("should keep local modal cards first when Braze publishes modal cards", async () => {
    const { store } = renderProvider(undefined, { overrideInitialState: withLocalModalCard });

    await publish([modalCard]);

    expect(store.getState().genericAwarenessModal.contentCards.map(card => card.id)).toEqual([
      "local-modal",
      "modal-campaign",
    ]);
  });

  it("should keep the modal card list when Braze republishes the same modal cards next to a local card", async () => {
    const { store } = renderProvider(undefined, { overrideInitialState: withLocalModalCard });
    await publish([modalCard]);
    const published = store.getState().genericAwarenessModal;

    await publish(copyCards([modalCard]));

    expect(store.getState().genericAwarenessModal).toBe(published);
  });

  it("should restore the Braze notification list when Braze republishes the same cards after a local edit", async () => {
    const { store } = renderProvider();
    await publish([notificationCard]);
    const published = store.getState().dynamicContent.notificationCards;
    await act(async () => {
      store.dispatch(
        setDynamicContentNotificationCards(published.map(card => ({ ...card, viewed: true }))),
      );
    });

    await publish(copyCards([notificationCard]));

    expect(store.getState().dynamicContent.notificationCards).toEqual(published);
  });
});
