import { useCallback, useEffect } from "react";
import Braze from "react-native-appboy-sdk";
import { useDispatch } from "react-redux";
import {
  setDynamicContentAssetsCards,
  setDynamicContentWalletCards,
} from "../actions/dynamicContent";
import {
  filterByPage,
  mapAsWalletContentCard,
  mapAsAssetContentCard,
  LocationContentCard,
} from "./dynamicContent";

const HookDynamicContentCards = () => {
  const dispatch = useDispatch();

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
  }, [dispatch]);

  useEffect(() => {
    Braze.requestContentCardsRefresh();
    fetchData();
  }, [fetchData]);

  return null;
};

export default HookDynamicContentCards;
