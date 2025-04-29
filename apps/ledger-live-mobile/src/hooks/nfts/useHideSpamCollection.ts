import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { SupportedBlockchain } from "@ledgerhq/live-nft/supported";
import { NftStatus } from "@ledgerhq/live-nft/types";
import { nftCollectionsStatusByNetworkSelector } from "~/reducers/settings";
import { updateNftStatus } from "~/actions/settings";

export function useHideSpamCollection() {
  const spamFilteringTxFeature = useFeature("llmSpamFilteringTx");
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");

  const nftCollectionsStatusByNetwork = useSelector(nftCollectionsStatusByNetworkSelector);

  const dispatch = useDispatch();

  const hideSpamCollection = useCallback(
    (collection: string, blockchain: SupportedBlockchain) => {
      const blockchainToCheck = nftCollectionsStatusByNetwork[blockchain] || {};
      const elem = Object.entries(blockchainToCheck).find(([key, _]) => key === collection);

      if (!elem) {
        dispatch(updateNftStatus({ blockchain, collection, status: NftStatus.spam }));
      }
    },
    [dispatch, nftCollectionsStatusByNetwork],
  );

  return {
    hideSpamCollection,
    enabled: (spamFilteringTxFeature?.enabled && nftsFromSimplehashFeature?.enabled) || false,
    nftCollectionsStatusByNetwork,
    spamFilteringTxFeature,
    nftsFromSimplehashFeature,
  };
}
