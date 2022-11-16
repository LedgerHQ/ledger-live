import { useCallback, useEffect } from "react";

import { useDispatch } from "react-redux";
import {
  setDynamicContentAssetsCards,
  setDynamicContentWalletCards,
} from "../actions/dynamicContent";
import { useBrazeContentCard } from "./brazeContentCard";
import {
  filterByPage,
  mapAsWalletContentCard,
  mapAsAssetContentCard,
  LocationContentCard,
} from "./dynamicContent";

const HookDynamicContentCards = () => {
  const dispatch = useDispatch();
  const { Braze, refreshDynamicContent } = useBrazeContentCard();

  const fetchData = useCallback(async () => {
    // Fetch data from Braze
    const contentCards = await Braze.getContentCards();
    console.log(
      "cards",
      contentCards.map(c => c.extras),
      "count",
      contentCards.length,
    );

    // Filtering v0
    const walletCards = filterByPage(
      contentCards,
      LocationContentCard.Wallet,
    ).map(card => mapAsWalletContentCard(card));

    const assetCards = filterByPage(
      contentCards,
      LocationContentCard.Asset,
    ).map(card => mapAsAssetContentCard(card));

    console.log("walletCards", walletCards.length);
    console.log("assetCards", assetCards.length);

    dispatch(setDynamicContentWalletCards(walletCards));
    dispatch(setDynamicContentAssetsCards(assetCards));
  }, [Braze, dispatch]);

  useEffect(() => {
    refreshDynamicContent();
    fetchData();
  }, [fetchData, refreshDynamicContent]);

  return null;
};

export default HookDynamicContentCards;
