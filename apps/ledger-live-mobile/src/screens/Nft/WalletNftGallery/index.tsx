import React, { useMemo } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { useTheme } from "styled-components/native";
import NftList from "~/components/Nft/NftGallery/NftList";
import NftGalleryEmptyState from "../NftGallery/NftGalleryEmptyState";
import CollapsibleHeaderScrollView from "~/components/WalletTab/CollapsibleHeaderScrollView";
import { accountsSelector, filteredNftsSelector, hasNftsSelector } from "~/reducers/accounts";

import isEqual from "lodash/isEqual";
import { getThreshold, useNftGalleryFilter } from "@ledgerhq/live-nft-react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { State } from "~/reducers/types";
import { useChains } from "../hooks/useChains";

const WalletNftGallery = () => {
  const { space } = useTheme();
  const hasNFTs = useSelector(hasNftsSelector);
  const accounts = useSelector(accountsSelector);
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const enabled = nftsFromSimplehashFeature?.enabled || false;
  const threshold = nftsFromSimplehashFeature?.params?.threshold;

  const { chains } = useChains();

  const nftsOwned = useSelector(
    (state: State) => filteredNftsSelector(state, Boolean(nftsFromSimplehashFeature?.enabled)),
    isEqual,
  );

  const addresses = useMemo(
    () =>
      [
        ...new Set(
          accounts
            .filter(account => chains.includes(account.currency.id))
            .map(account => account.freshAddress),
        ),
      ].join(","),
    [accounts, chains],
  );

  const { isLoading, hasNextPage, error, fetchNextPage, refetch, nfts } = useNftGalleryFilter({
    addresses,
    chains,
    nftsOwned,
    threshold: getThreshold(threshold),
    enabled,
    staleTime: nftsFromSimplehashFeature?.params?.staleTime,
  });

  const useSimpleHash = Boolean(nftsFromSimplehashFeature?.enabled);

  return (
    <Flex flex={1} testID="wallet-nft-gallery-screen">
      {hasNFTs ? (
        <NftList
          data={useSimpleHash ? nfts : nftsOwned}
          isLoading={useSimpleHash ? isLoading : false}
          error={error}
          refetch={refetch}
          hasNextPage={!!hasNextPage && useSimpleHash}
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
