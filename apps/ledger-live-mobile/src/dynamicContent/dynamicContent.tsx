import { useDispatch, useSelector } from "react-redux";
import { ContentCard as BrazeContentCard } from "react-native-appboy-sdk";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCallback, useMemo } from "react";
import { useBrazeContentCard } from "./brazeContentCard";
import {
  assetsCardsSelector,
  learnCardsSelector,
  notificationsCardsSelector,
  walletCardsSelector,
} from "../reducers/dynamicContent";
import { dismissedDynamicCardsSelector } from "../reducers/settings";
import {
  AssetContentCard,
  Background,
  LearnContentCard,
  LocationContentCard,
  NotificationContentCard,
  WalletContentCard,
} from "./types";
import { track } from "../analytics";
import { setDismissedDynamicCards } from "../actions/settings";

export const getMobileContentCards = (array: BrazeContentCard[]) =>
  array.filter(
    elem => !elem.extras.platform || elem.extras.platform === "mobile",
  );

export const filterByPage = (array: BrazeContentCard[], page: string) =>
  array.filter(elem => elem.extras.location === page);

export const mapAsWalletContentCard = (card: BrazeContentCard) =>
  ({
    id: card.id,
    tag: card.extras.tag,
    title: card.extras.title,
    location: LocationContentCard.Wallet,
    image: card.extras.image,
    link: card.extras.link,
    background:
      Background[card.extras.background as Background] || Background.purple,
    createdAt: card.created,
  } as WalletContentCard);

export const mapAsAssetContentCard = (card: BrazeContentCard) =>
  ({
    id: card.id,
    tag: card.extras.tag,
    title: card.extras.title,
    location: LocationContentCard.Asset,
    image: card.extras.image,
    link: card.extras.link,
    cta: card.extras.cta,
    assets: card.extras.assets ?? "",
    displayOnEveryAssets: Boolean(card.extras.displayOnEveryAssets) ?? false,
    createdAt: card.created,
  } as AssetContentCard);

export const mapAsLearnContentCard = (card: BrazeContentCard) =>
  ({
    id: card.id,
    tag: card.extras.tag,
    title: card.extras.title,
    location: LocationContentCard.Learn,
    image: card.extras.image,
    link: card.extras.link,
    createdAt: card.created,
  } as LearnContentCard);

export const mapAsNotificationContentCard = (card: BrazeContentCard) =>
  ({
    id: card.id,
    tag: card.extras.tag,
    title: card.extras.title,
    description: card.extras.description,
    location: LocationContentCard.NotificationCenter,
    link: card.extras.link,
    cta: card.extras.cta,
    createdAt: card.created,
    viewed: card.viewed,
  } as NotificationContentCard);

const useDynamicContent = () => {
  const dispatch = useDispatch();
  const {
    logClickCard,
    logDismissCard,
    logImpressionCard,
    refreshDynamicContent,
  } = useBrazeContentCard();
  const notificationCards = useSelector(notificationsCardsSelector);
  const assetsCards = useSelector(assetsCardsSelector);
  const walletCards = useSelector(walletCardsSelector);
  const learnCards = useSelector(learnCardsSelector);
  const hiddenCards: string[] = useSelector(dismissedDynamicCardsSelector);

  const walletCardsDisplayed = useMemo(
    () =>
      walletCards.filter(
        (wc: WalletContentCard) => !hiddenCards.includes(wc.id),
      ),
    [walletCards, hiddenCards],
  );
  const assetsCardsDisplayed = useMemo(
    () =>
      assetsCards.filter(
        (ac: AssetContentCard) => !hiddenCards.includes(ac.id),
      ),
    [assetsCards, hiddenCards],
  );
  const orderedNotificationsCards = useMemo(
    () =>
      notificationCards.sort(
        (notif: NotificationContentCard, nt: NotificationContentCard) =>
          nt.createdAt - notif.createdAt,
      ),
    [notificationCards],
  );
  const isAWalletCardDisplayed = useMemo(
    () => walletCardsDisplayed.length >= 1,
    [walletCardsDisplayed],
  );
  const isAtLeastOneCardDisplayed = useMemo(
    () => isAWalletCardDisplayed || assetsCardsDisplayed.length >= 1,
    [isAWalletCardDisplayed, assetsCardsDisplayed],
  );

  const getAssetCardByIdOrTicker = useCallback(
    (currency: CryptoOrTokenCurrency): AssetContentCard | undefined => {
      if (!currency) {
        return undefined;
      }

      return assetsCardsDisplayed.find(
        (ac: AssetContentCard) =>
          ac.assets.toLowerCase().includes(currency.id.toLowerCase()) ||
          ac.assets.toUpperCase().includes(currency.ticker.toUpperCase()) ||
          ac.displayOnEveryAssets,
      );
    },
    [assetsCardsDisplayed],
  );

  const dismissCard = useCallback(
    (cardId: string) => {
      dispatch(setDismissedDynamicCards([...hiddenCards, cardId]));
    },
    [dispatch, hiddenCards],
  );

  const trackContentCardEvent = useCallback(
    (
      event: "contentcard_clicked" | "contentcard_dismissed",
      params: {
        campaign: string;
        screen: string;
        link: string;
        contentcard?: string;
      },
    ) => {
      track(event, params);
    },
    [],
  );

  return {
    walletCards,
    walletCardsDisplayed,
    isAWalletCardDisplayed,
    assetsCards,
    learnCards,
    getAssetCardByIdOrTicker,
    isAtLeastOneCardDisplayed,
    logClickCard,
    logDismissCard,
    logImpressionCard,
    dismissCard,
    trackContentCardEvent,
    notificationCards,
    orderedNotificationsCards,
    refreshDynamicContent,
  };
};

export default useDynamicContent;
