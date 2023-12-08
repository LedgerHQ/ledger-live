import { useDispatch, useSelector } from "react-redux";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCallback, useMemo } from "react";
import { useBrazeContentCard } from "./brazeContentCard";
import {
  assetsCardsSelector,
  categoriesCardsSelector,
  mobileCardsSelector,
  learnCardsSelector,
  notificationsCardsSelector,
  walletCardsSelector,
} from "../reducers/dynamicContent";
import { dismissedDynamicCardsSelector } from "../reducers/settings";
import { AssetContentCard, WalletContentCard } from "./types";
import { track } from "../analytics";
import { setDismissedDynamicCards } from "../actions/settings";
import { setDynamicContentMobileCards } from "~/actions/dynamicContent";

const useDynamicContent = () => {
  const dispatch = useDispatch();
  const { logClickCard, logDismissCard, logImpressionCard, refreshDynamicContent } =
    useBrazeContentCard();
  const notificationCards = useSelector(notificationsCardsSelector);
  const assetsCards = useSelector(assetsCardsSelector);
  const walletCards = useSelector(walletCardsSelector);
  const learnCards = useSelector(learnCardsSelector);
  const categoriesCards = useSelector(categoriesCardsSelector);
  const mobileCards = useSelector(mobileCardsSelector);
  const hiddenCards: string[] = useSelector(dismissedDynamicCardsSelector);

  const walletCardsDisplayed = useMemo(
    () => walletCards.filter((wc: WalletContentCard) => !hiddenCards.includes(wc.id)),
    [walletCards, hiddenCards],
  );
  const assetsCardsDisplayed = useMemo(
    () => assetsCards.filter((ac: AssetContentCard) => !hiddenCards.includes(ac.id)),
    [assetsCards, hiddenCards],
  );
  const isAWalletCardDisplayed = useMemo(
    () => walletCardsDisplayed.length >= 1,
    [walletCardsDisplayed],
  );

  const getAssetCardByIdOrTicker = useCallback(
    (currency: CryptoOrTokenCurrency): AssetContentCard | undefined => {
      if (!currency) {
        return undefined;
      }

      return assetsCardsDisplayed.find(
        (ac: AssetContentCard) =>
          (ac.assets && ac.assets.toLowerCase().includes(currency.id.toLowerCase())) ||
          (ac.assets && ac.assets.toUpperCase().includes(currency.ticker.toUpperCase())) ||
          ac.displayOnEveryAssets,
      );
    },
    [assetsCardsDisplayed],
  );

  const dismissCard = useCallback(
    (cardId: string) => {
      dispatch(setDismissedDynamicCards([...hiddenCards, cardId]));
      dispatch(setDynamicContentMobileCards(mobileCards.filter(n => n.id !== cardId)));
    },
    [dispatch, hiddenCards, mobileCards],
  );

  const trackContentCardEvent = useCallback(
    (
      event: "contentcard_clicked" | "contentcard_dismissed",
      params: {
        campaign?: string;
        screen?: string;
        page?: string;
        link?: string;
        contentcard?: string;
        type?: string;
        layout?: string;
        location?: string;
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
    categoriesCards,
    mobileCards,
    getAssetCardByIdOrTicker,
    logClickCard,
    logDismissCard,
    logImpressionCard,
    dismissCard,
    trackContentCardEvent,
    notificationCards,
    refreshDynamicContent,
  };
};

export default useDynamicContent;
