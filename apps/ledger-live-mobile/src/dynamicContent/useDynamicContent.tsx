import { useSelector, useDispatch } from "~/context/hooks";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCallback, useMemo } from "react";
import { useBrazeContentCard } from "./brazeContentCard";
import {
  assetsCardsSelector,
  categoriesCardsSelector,
  mobileCardsSelector,
  notificationsCardsSelector,
  walletCardsSelector,
  landingPageStickyCtaCardsSelector,
} from "../reducers/dynamicContent";
import { dismissedDynamicCardsSelector } from "../reducers/settings";
import {
  AssetContentCard,
  LandingPageStickyCtaContentCard,
  LandingPageUseCase,
  WalletContentCard,
} from "./types";
import { track } from "../analytics";
import { setDismissedDynamicCards } from "../actions/settings";
import { setDynamicContentMobileCards } from "~/actions/dynamicContent";

const useDynamicContent = () => {
  const dispatch = useDispatch();
  const notificationCards = useSelector(notificationsCardsSelector);
  const assetsCards = useSelector(assetsCardsSelector);
  const walletCards = useSelector(walletCardsSelector);
  const categoriesCards = useSelector(categoriesCardsSelector);
  const landingPageStickyCtaCards = useSelector(landingPageStickyCtaCardsSelector);
  const mobileCards = useSelector(mobileCardsSelector);
  const hiddenCards: string[] = useSelector(dismissedDynamicCardsSelector);

  const { logClickCard, logDismissCard, logImpressionCard, refreshDynamicContent } =
    useBrazeContentCard(mobileCards);

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

  const getStickyCtaCardByLandingPage = (landingPage: LandingPageUseCase) =>
    landingPageStickyCtaCards.find(
      (card: LandingPageStickyCtaContentCard) => card.landingPage === landingPage,
    );

  const dismissCard = useCallback(
    (cardId: string) => {
      dispatch(setDismissedDynamicCards([...hiddenCards, cardId]));
      dispatch(setDynamicContentMobileCards(mobileCards.filter(n => n.id !== cardId)));
      logDismissCard(cardId);
    },
    [dispatch, hiddenCards, mobileCards, logDismissCard],
  );

  const trackContentCardEvent = useCallback(
    (
      event: "contentcard_clicked" | "contentcard_dismissed",
      params: Record<string, string | number | undefined>,
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
    categoriesCards,
    mobileCards,
    getAssetCardByIdOrTicker,
    getStickyCtaCardByLandingPage,
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
