import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { nftCollectionsStatusByNetworkSelector } from "~/reducers/settings";
import { updateNftStatusBatch } from "~/actions/settings";

import { BlockchainsType } from "@ledgerhq/live-nft/supported";
import { NFTResource } from "@ledgerhq/live-nft/types";

export function useHideSpamCollection() {
  const spamFilteringTxFeature = useFeature("llmSpamFilteringTx");
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const nftCollectionsStatusByNetwork = useSelector(nftCollectionsStatusByNetworkSelector);

  const dispatch = useDispatch();

  const updateSpamCollection = useCallback(
    (metadata: NFTResource[]) => {
      if (metadata.length > 0 && metadata.every(contract => contract.status === "loaded")) {
        console.log(nftCollectionsStatusByNetwork);
        console.log(metadata);
        //dispatch(updateNftStatusBatch(metadata));
      }
    },
    [dispatch, nftCollectionsStatusByNetwork],
  );

  return {
    updateSpamCollection,
    enabled: (spamFilteringTxFeature?.enabled && nftsFromSimplehashFeature?.enabled) || false,
  };
}
