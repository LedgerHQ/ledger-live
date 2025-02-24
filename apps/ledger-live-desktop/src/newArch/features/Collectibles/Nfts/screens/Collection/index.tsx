import React, { memo, useEffect, useState } from "react";
import useNftCollectionModel from "./useNftCollectionModel";
import { useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import { Flex, Icons } from "@ledgerhq/react-ui";
import { Skeleton, Media, CollectionName, TableLayout } from "LLD/features/Collectibles/components";
import TokensList from "../../components/TokensList";
import OperationsList from "~/renderer/components/OperationsList";
import Spinner from "~/renderer/components/Spinner";
import { TrackingPageCategory } from "LLD/features/Collectibles/types/enum/Tracking";
import { Footer, SpinnerContainer, SpinnerBackground } from "../../components/CommonStyled";

type ViewProps = ReturnType<typeof useNftCollectionModel>;

function View({
  isLoading,
  account,
  collectionAddress,
  nfts,
  metadata,
  slicedNfts,
  listFooterRef,
  maxVisibleNFTs,
  filterOperation,
  onSend,
}: ViewProps) {
  const { t } = useTranslation();
  const [areItemsLoading, setAreItemsLoading] = useState(false);

  useEffect(() => {
    setAreItemsLoading(maxVisibleNFTs < nfts.length);
  }, [maxVisibleNFTs, nfts.length]);

  return (
    <>
      <TrackPage category={TrackingPageCategory.NFTSpecificCollection} />
      <Flex flexDirection={"column"} mb={16} width={"100%"}>
        <Flex flex={1} justifyContent={"space-between"}>
          <Box horizontal alignItems="center" mb={16}>
            <Skeleton width={40} minHeight={40} show={isLoading}>
              <Media
                size={40}
                uri={metadata?.medias.preview.uri}
                tokenId={metadata?.tokenId}
                mediaType={metadata?.medias.preview.mediaType}
                isLoading={isLoading}
                contentType="image"
                useFallback
              />
            </Skeleton>
            <Box ml={3}>
              <Skeleton width={93} barHeight={6} minHeight={24} show={isLoading}>
                <Text ff="Inter|Regular" color="palette.text.shade60" fontSize={2}>
                  {t("NFT.gallery.collection.header.contract", {
                    contract: collectionAddress,
                  })}
                </Text>
                <Skeleton width={93} barHeight={6} minHeight={24} show={isLoading}>
                  <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={22}>
                    <CollectionName nft={nfts[0]} />
                  </Text>
                </Skeleton>
              </Skeleton>
            </Box>
          </Box>
          <Button small primary icon onClick={onSend}>
            <Box horizontal flow={1} alignItems="center">
              <Icons.ArrowUp size={"S"} />
              <Box>{t("NFT.gallery.collection.header.sendCTA")}</Box>
            </Box>
          </Button>
        </Flex>
        <TableLayout />
        {account && <TokensList account={account} nfts={slicedNfts} />}
        <Footer ref={listFooterRef}>
          {areItemsLoading && (
            <SpinnerContainer>
              <SpinnerBackground>
                <Spinner size={14} />
              </SpinnerBackground>
            </SpinnerContainer>
          )}
        </Footer>
        <OperationsList
          account={account}
          title={t("NFT.gallery.collection.operationList.header")}
          filterOperation={collectionAddress ? filterOperation : undefined}
        />
      </Flex>
    </>
  );
}

const NftCollection: React.FC = () => {
  return <View {...useNftCollectionModel()} />;
};

export default memo(NftCollection);
