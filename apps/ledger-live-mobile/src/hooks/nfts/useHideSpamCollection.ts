import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { hideNftCollection } from "~/actions/settings";
import { whitelistedNftCollectionsSelector } from "~/reducers/settings";

export function useHideSpamCollection() {
  const spamFilteringTxFeature = useFeature("spamFilteringTx");
  const whitelistedNftCollections = useSelector(whitelistedNftCollectionsSelector);

  const dispatch = useDispatch();
  const hideSpamCollection = useCallback(
    (collection: string) => {
      if (!whitelistedNftCollections.includes(collection)) {
        dispatch(hideNftCollection(collection));
      }
    },
    [dispatch, whitelistedNftCollections],
  );

  return {
    hideSpamCollection,
    enabled: spamFilteringTxFeature?.enabled,
  };
}
