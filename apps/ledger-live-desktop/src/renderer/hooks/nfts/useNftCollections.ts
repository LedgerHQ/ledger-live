import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { decodeCollectionId, getThreshold, useNftGalleryFilter } from "@ledgerhq/live-nft-react";
import { nftsByCollections } from "@ledgerhq/live-nft/index";
import { BlockchainEVM } from "@ledgerhq/live-nft/supported";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { useMemo } from "react";
import { useNftCollectionsStatus } from "./useNftCollectionsStatus";

export function useNftCollections({
  account,
  nftsOwned,
  addresses,
  chains,
}: {
  account?: Account;
  nftsOwned?: ProtoNFT[];
  addresses?: string;
  chains?: string[];
}) {
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const threshold = nftsFromSimplehashFeature?.params?.threshold;
  const staleTime = nftsFromSimplehashFeature?.params?.staleTime;
  const simplehashEnabled = nftsFromSimplehashFeature?.enabled || false;

  const { hiddenNftCollections, whitelistedNftCollections } = useNftCollectionsStatus();

  const nftsOwnedToCheck = useMemo(() => account?.nfts ?? nftsOwned, [account?.nfts, nftsOwned]);

  const whitelistedNfts = useMemo(
    () =>
      nftsOwnedToCheck?.filter(nft =>
        whitelistedNftCollections
          .map(collection => decodeCollectionId(collection).contractAddress)
          .includes(nft.contract),
      ) ?? [],
    [nftsOwnedToCheck, whitelistedNftCollections],
  );

  const { nfts, fetchNextPage, hasNextPage } = useNftGalleryFilter({
    nftsOwned: account?.nfts ?? nftsOwned ?? [],
    addresses: account?.freshAddress ?? addresses ?? "",
    chains: account
      ? [account.currency.id || BlockchainEVM.Ethereum]
      : chains ?? [BlockchainEVM.Ethereum],
    threshold: getThreshold(threshold),
    enabled: simplehashEnabled,
    staleTime,
  });

  const allNfts = useMemo(
    () => (simplehashEnabled ? [...nfts, ...whitelistedNfts] : account?.nfts || nftsOwned || []),
    [simplehashEnabled, nfts, whitelistedNfts, account, nftsOwned],
  );

  const collections = useMemo(
    () =>
      Object.entries(nftsByCollections(allNfts)).filter(
        ([contract]) => !hiddenNftCollections.includes(`${account?.id}|${contract}`),
      ),
    [account?.id, allNfts, hiddenNftCollections],
  );

  const collectionsLength = Object.keys(collections).length;

  return {
    collections,
    collectionsLength,
    fetchNextPage,
    hasNextPage,
    nfts,
    allNfts,
  };
}
