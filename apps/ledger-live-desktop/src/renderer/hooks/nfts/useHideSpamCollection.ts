import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { nftCollectionsStatusByNetworkSelector } from "~/renderer/reducers/settings";
import { updateNftStatus } from "~/renderer/actions/settings";
import { BlockchainsType } from "@ledgerhq/live-nft/supported";
import { NftStatus } from "@ledgerhq/live-nft/types";

export function useHideSpamCollection() {
  const spamFilteringTxFeature = useFeature("lldSpamFilteringTx");
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");

  const nftCollectionsStatusByNetwork = useSelector(nftCollectionsStatusByNetworkSelector);

  const dispatch = useDispatch();

  const hideSpamCollection = useCallback(
    (collection: string, blockchain: BlockchainsType) => {
      const blockchainToCheck = nftCollectionsStatusByNetwork[blockchain] || {};
      const elem = Object.entries(blockchainToCheck).find(([key, _]) => key === collection);

      if (!elem) {
        dispatch(updateNftStatus(blockchain, collection, NftStatus.spam));
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
