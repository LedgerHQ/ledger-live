import { useCallback, useEffect } from "react";

import { useDispatch } from "react-redux";
import {
  setDynamicContentAssetsCards,
  setDynamicContentLearnCards,
  setDynamicContentWalletCards,
} from "../actions/dynamicContent";
import { useBrazeContentCard } from "./brazeContentCard";
import {
  filterByPage,
  mapAsWalletContentCard,
  mapAsAssetContentCard,
  mapAsLearnContentCard,
} from "./dynamicContent";
import { LocationContentCard } from "./types";

const HookDynamicContentCards = () => {
  const dispatch = useDispatch();
  const { Braze, refreshDynamicContent } = useBrazeContentCard();

  const fetchData = useCallback(async () => {
    // Fetch data from Braze
    const contentCards = await Braze.getContentCards();

    // Filtering v0
    const walletCards = filterByPage(
      contentCards,
      LocationContentCard.Wallet,
    ).map(card => mapAsWalletContentCard(card));

    const assetCards = filterByPage(
      contentCards,
      LocationContentCard.Asset,
    ).map(card => mapAsAssetContentCard(card));

    const learnCards = filterByPage(
      contentCards,
      LocationContentCard.Learn,
    ).map(card => mapAsLearnContentCard(card));

    dispatch(setDynamicContentWalletCards(walletCards));
    dispatch(setDynamicContentAssetsCards(assetCards));
    dispatch(setDynamicContentLearnCards(learnCards));
  }, [Braze, dispatch]);

  useEffect(() => {
    refreshDynamicContent();
    fetchData();
  }, [fetchData, refreshDynamicContent]);

  return null;
};

export default HookDynamicContentCards;
