import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { NftStatus } from "@ledgerhq/live-nft/types";
import { BlockchainEVM } from "@ledgerhq/live-nft/supported";
import { nftCollectionsStatusByNetworkSelector } from "~/reducers/settings";

export const nftCollectionParser = (
  nftCollection: Record<BlockchainEVM, Record<string, NftStatus>>,
  applyFilterFn: (arg0: [string, NftStatus]) => boolean,
) =>
  Object.values(nftCollection).flatMap(contracts =>
    Object.entries(contracts)
      .filter(applyFilterFn)
      .map(([contract]) => contract),
  );

export function useNftCollectionsStatus() {
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const nftCollectionsStatusByNetwork = useSelector(nftCollectionsStatusByNetworkSelector);

  const hideSpam = Boolean(nftsFromSimplehashFeature?.enabled);

  const list = useMemo(() => {
    return nftCollectionParser(nftCollectionsStatusByNetwork, ([_, status]) =>
      hideSpam ? status !== NftStatus.whitelisted : status === NftStatus.blacklisted,
    );
  }, [nftCollectionsStatusByNetwork, hideSpam]);

  const whitelisted = useMemo(() => {
    return nftCollectionParser(
      nftCollectionsStatusByNetwork,
      ([_, status]) => status === NftStatus.whitelisted,
    );
  }, [nftCollectionsStatusByNetwork]);

  return {
    hiddenNftCollections: list,
    whitelistedNftCollections: whitelisted,
  };
}
