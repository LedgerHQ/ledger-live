import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { hideNftCollection } from "~/renderer/actions/settings";
import { hiddenNftCollectionsSelector } from "../reducers/settings";

export function useHideSpamCollection() {
  const spamFilteringTxFeature = useFeature("spamFilteringTx");
  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);
  const dispatch = useDispatch();
  const hideSpamCollection = useCallback(
    (collection: string) => {
      if (!hiddenNftCollections.includes(collection)) {
        dispatch(hideNftCollection(collection));
      }
    },
    [dispatch, hiddenNftCollections],
  );

  return {
    hideSpamCollection,
    enabled: spamFilteringTxFeature?.enabled,
  };
}
