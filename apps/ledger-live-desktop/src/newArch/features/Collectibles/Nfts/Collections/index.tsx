import React, { useMemo } from "react";
import { useNftCollectionsModel } from "./useNftCollectionsModel";
import { Box, Icons, Flex } from "@ledgerhq/react-ui";
import TableContainer from "~/renderer/components/TableContainer";
import TableHeader from "../../components/Collection/TableHeader";
import { Account } from "@ledgerhq/types-live";
import { useNftMetadata } from "@ledgerhq/live-nft-react";
import TableRow from "../../components/Collection/TableRow";
import EmptyCollection from "../../components/Collection/EmptyCollection";
import { CollectibleTypeEnum } from "../../types/Collectibles";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import ShowMore from "../../components/Collection/ShowMore";
import { FieldStatus } from "../../types/DetailDrawer";
import CollectionContextMenu from "LLD/components/ContextMenu/CollectibleContextMenu";
import HeaderActions from "../../components/Collection/HeaderActions";
import { TableHeaderProps, TableHeaderTitleKey as TitleKey } from "../../types/Collection";

type ViewProps = ReturnType<typeof useNftCollectionsModel>;

type NftItemProps = {
  contract: string;
  tokenId: string;
  currencyId: string;
  numberOfNfts: number;
  account: Account;
  onClick: (collectionAddress: string) => void;
};

type Props = {
  account: Account;
};

const NftItem: React.FC<NftItemProps> = ({
  contract,
  tokenId,
  currencyId,
  account,
  numberOfNfts,
  onClick,
}) => {
  console.log("contract", contract);
  const { metadata, status } = useNftMetadata(contract, tokenId, currencyId);
  const isLoading = status === FieldStatus.Loading;

  return (
    <CollectionContextMenu
      collectionName={metadata?.tokenName}
      collectionAddress={contract}
      account={account}
      typeOfCollectible={CollectibleTypeEnum.NFT}
    >
      <TableRow
        isLoading={isLoading}
        tokenName={metadata?.tokenName || metadata?.nftName || "-"}
        numberOfNfts={numberOfNfts}
        onClick={() => onClick(contract)}
        media={{
          isLoading: isLoading,
          useFallback: true,
          contentType: "image",
          uri: metadata?.medias.preview.uri,
          mediaType: metadata?.medias.preview.mediaType,
        }}
      />
    </CollectionContextMenu>
  );
};

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
  const [areItemsLoading, setAreItemsLoading] = React.useState(false);

  useEffect(() => {
    setAreItemsLoading(maxVisibleNFTs < nfts.length);
  }, [maxVisibleNFTs, nfts.length]);

  return (
    <>
      <TrackPage category="Page" name="NFT Specific Collection" />
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
          t={t}
        />
      </Flex>
    </>
  );
}

const NftCollections: React.FC<Props> = ({ account }) => {
  return <View {...useNftCollectionsModel({ account })} account={account} />;
};

export default NftCollections;
