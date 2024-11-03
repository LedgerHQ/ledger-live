import React, { useMemo } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { useTheme } from "styled-components/native";
import NftList from "~/components/Nft/NftGallery/NftList";
import NftGalleryEmptyState from "../NftGallery/NftGalleryEmptyState";
import CollapsibleHeaderScrollView from "~/components/WalletTab/CollapsibleHeaderScrollView";
import { accountsSelector, filteredNftsSelector, hasNftsSelector } from "~/reducers/accounts";

import isEqual from "lodash/isEqual";
import { galleryChainFiltersSelector } from "~/reducers/nft";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useNftCollections } from "~/hooks/nfts/useNftCollections";

const WalletNftGallery = () => {
  const { space } = useTheme();
  const hasNFTs = useSelector(hasNftsSelector);
  const accounts = useSelector(accountsSelector);
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");

  const chainFilters = useSelector(galleryChainFiltersSelector);
  const nftsOwned = useSelector(filteredNftsSelector, isEqual);

  const addresses = useMemo(
    () =>
      [
        ...new Set(
          accounts.map(account => account.freshAddress).filter(addr => addr.startsWith("0x")),
        ),
      ].join(","),
    [accounts],
  );

  const chains = useMemo(
    () =>
      Object.entries(chainFilters)
        .filter(([_, value]) => value)
        .map(([key, _]) => key),
    [chainFilters],
  );

  const { isLoading, hasNextPage, error, fetchNextPage, refetch, allNfts } = useNftCollections({
    addresses,
    chains,
    nftsOwned,
  });

  const useSimpleHash = Boolean(nftsFromSimplehashFeature?.enabled);

  return (
    <Flex flex={1} testID="wallet-nft-gallery-screen">
      {hasNFTs ? (
        <NftList
          data={allNfts}
          isLoading={useSimpleHash ? isLoading : false}
          error={error}
          refetch={refetch}
          fetchNextPage={() => {
            if (useSimpleHash && hasNextPage) {
              fetchNextPage();
            }
          }}
        />
      ) : (
        <CollapsibleHeaderScrollView
          contentContainerStyle={{
            paddingTop: 0,
            marginTop: 0,
            marginHorizontal: space[6],
          }}
        >
          <NftGalleryEmptyState />
        </CollapsibleHeaderScrollView>
      )}
    </Flex>
  );
};

export default WalletNftGallery;
