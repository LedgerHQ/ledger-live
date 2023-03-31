import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Flex, Grid, InfiniteLoader, Text } from "@ledgerhq/react-ui";
import { NFTMetadata } from "@ledgerhq/types-live";
import { orderedVisibleNftsSelector } from "../../reducers/accounts";
import NftGalleryEmptyState from "./NftGalleryEmptyState";
import isEqual from "lodash/isEqual";
import NFTItem from "./NFTItem";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import useOnScreen from "~/renderer/screens/nft/useOnScreen";

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
  const nftsOrdered = useSelector(orderedVisibleNftsSelector, isEqual);
  const { t } = useTranslation();

  const [displayedCount, setDisplayedCount] = useState(10);

  const content = useMemo(
    () =>
      nftsOrdered.slice(0, displayedCount).map((nft, index) => {
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
    [nftsOrdered, displayedCount, selectedNftId, handlePickNft],
  );

  const loaderContainerRef = useRef<HTMLDivElement>(null);
  const isLoaderVisible = useOnScreen(loaderContainerRef);
  useEffect(() => {
    if (isLoaderVisible) setDisplayedCount(displayedCount => displayedCount + 10);
  }, [isLoaderVisible]);

  if (nftsOrdered.length <= 0) return <NftGalleryEmptyState />;

  return (
    <Flex flex={1} flexDirection="column" overflowY="hidden">
      <Text px={12} variant="large" fontWeight="semiBold">
        {t("customImage.steps.choose.myNfts")}
      </Text>
      <ScrollContainer px={12} mt={3} pt={3} pb={6}>
        <Grid flex={1} columns={2} rowGap={6} columnGap={6}>
          {content}
        </Grid>
        {displayedCount < nftsOrdered.length ? (
          <Flex ref={loaderContainerRef} flex={1} m={6} justifyContent="center">
            <InfiniteLoader size={20} />
          </Flex>
        ) : null}
      </ScrollContainer>
    </Flex>
  );
};

export default React.memo(NFTGallerySelector);
