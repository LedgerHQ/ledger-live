import Braze, { type ContentCard } from "@braze/react-native-sdk";
import { act, render } from "@tests/test-renderer";
import React, { useEffect } from "react";
import {
  BrazeContentCardsProvider,
  useBrazeContentCards,
} from "../components/BrazeContentCardsProvider";

const mockedAddListener = jest.mocked(Braze.addListener);
const mockedRequestContentCardsRefresh = jest.mocked(Braze.requestContentCardsRefresh);
const resolvedRefresh = () => Promise.resolve();
type BrazeContentCardsLifecycle = ReturnType<typeof useBrazeContentCards>;
const defaultLifecycle: BrazeContentCardsLifecycle = {
  prepareForIdentityTransition: () => {},
  refreshContentCards: resolvedRefresh,
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

    lifecycle.prepareForIdentityTransition();
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
});
