import React, { useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Flex, Grid, InfiniteLoader, Text } from "@ledgerhq/react-ui";
import { NFTMetadata } from "@ledgerhq/types-live";
import { accountsSelector, orderedVisibleNftsSelector } from "~/renderer/reducers/accounts";
import NftGalleryEmptyState from "./NftGalleryEmptyState";
import isEqual from "lodash/isEqual";
import NFTItem from "./NFTItem";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useOnScreen } from "~/renderer/screens/nft/useOnScreen";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { getThreshold, useNftGalleryFilter, useNftQueriesSources } from "@ledgerhq/live-nft-react";
import { getEnv } from "@ledgerhq/live-env";
import { State } from "~/renderer/reducers";
import NftGalleryLoadingState from "./NftGalleryLoadingState";

const ScrollContainer = styled(Flex).attrs({
  flexDirection: "column",
  flexShrink: 1,
  overflowY: "scroll",
})`
  ::-webkit-scrollbar {
    width: 0;
    height: 0;
    background: transparent;
  }
`;

type Props = {
  handlePickNft: (id: string, nftMetadata: NFTMetadata) => void;
  selectedNftId?: string;
};

const NFTGallerySelector = ({ handlePickNft, selectedNftId }: Props) => {
  const SUPPORTED_NFT_CURRENCIES = getEnv("NFT_CURRENCIES");
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const lldSolanaNftsFeature = useFeature("lldSolanaNfts");
  const threshold = nftsFromSimplehashFeature?.params?.threshold;
  const accounts = useSelector(accountsSelector);
  const nftsOrdered = useSelector(
    (state: State) =>
      orderedVisibleNftsSelector(state, Boolean(nftsFromSimplehashFeature?.enabled)),
    isEqual,
  );

  const { addresses, chains } = useNftQueriesSources({
    accounts,
    supportedCurrencies: SUPPORTED_NFT_CURRENCIES,
    config: { featureFlagEnabled: lldSolanaNftsFeature?.enabled },
  });

  const {
    nfts: nftsFiltered,
    fetchNextPage,
    hasNextPage,
    isLoading,
  } = useNftGalleryFilter({
    nftsOwned: nftsOrdered || [],
    addresses,
    chains,
    threshold: getThreshold(threshold),
    enabled: nftsFromSimplehashFeature?.enabled || false,
  });

  const nfts = nftsFromSimplehashFeature?.enabled ? nftsFiltered : nftsOrdered;
  const { t } = useTranslation();

  const [displayedCount, setDisplayedCount] = useState(10);

  const content = useMemo(
    () =>
      nfts.slice(0, displayedCount).map((nft, index) => {
        const { id } = nft;
        return (
          <NFTItem
            key={id}
            id={id}
            selected={selectedNftId === id}
            onItemClick={handlePickNft}
            testId={`custom-image-nft-card-${index}`}
            index={index}
          />
        );
      }),
    [nfts, displayedCount, selectedNftId, handlePickNft],
  );

  const loaderContainerRef = useRef<HTMLDivElement>(null);
  const updateDisplayable = () => {
    setDisplayedCount(displayedCount => displayedCount + 10);
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  useOnScreen({
    enabled: displayedCount < nfts.length,
    onIntersect: updateDisplayable,
    target: loaderContainerRef,
    threshold: 0.5,
  });

  if (isLoading) return <NftGalleryLoadingState />;

  if (nfts.length <= 0) return <NftGalleryEmptyState />;

  return (
    <Flex flex={1} flexDirection="column" overflowY="hidden">
      <Text px={12} variant="large" fontWeight="semiBold">
        {t("customImage.steps.choose.myNfts")}
      </Text>
      <ScrollContainer px={12} mt={3} pt={3} pb={6}>
        <Grid flex={1} columns={2} rowGap={6} columnGap={6}>
          {content}
        </Grid>
        {displayedCount < nfts.length ? (
          <Flex ref={loaderContainerRef} flex={1} m={6} justifyContent="center">
            <InfiniteLoader size={20} />
          </Flex>
        ) : null}
      </ScrollContainer>
    </Flex>
  );
};

export default React.memo(NFTGallerySelector);
