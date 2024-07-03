import React, { useMemo } from "react";
import { useNftCollectionModel } from "./useNftCollectionModel";
import { Box, Icons, Flex } from "@ledgerhq/react-ui";
import TableContainer from "~/renderer/components/TableContainer";
import TableHeader from "../../components/Collection/TableHeader";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
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

export type NftsInTheCollections = {
  contract: string;
  nft: ProtoNFT;
  nftsNumber: number;
  onClick: (collectionAddress: string) => void;
};

type ViewProps = {
  nftsInTheCollection: NftsInTheCollections[];
  account: Account;
  displayShowMore: boolean;
  onOpenGallery: () => void;
  onReceive: () => void;
  onOpenCollection: (collectionAddress: string) => void;
  onShowMore: () => void;
};

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
        tokenName={metadata?.tokenName || contract}
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
  nftsInTheCollection,
  account,
  displayShowMore,
  onOpenGallery,
  onReceive,
  onOpenCollection,
  onShowMore,
}: ViewProps) {
  const { t } = useTranslation();
  const hasNfts = nftsInTheCollection.length > 0;

  const actions = useMemo(() => {
    return hasNfts
      ? [
          {
            element: (
              <HeaderActions textKey="NFT.collections.receiveCTA">
                <Icons.ArrowDown size="S" />
              </HeaderActions>
            ),
            action: onReceive,
          },
          {
            element: <HeaderActions textKey="NFT.collections.galleryCTA" />,
            action: onOpenGallery,
          },
        ]
      : [];
  }, [hasNfts, onReceive, onOpenGallery]);

  const tableHeaderProps: TableHeaderProps = {
    titleKey: TitleKey.NFTCollections,
    actions,
  };

  return (
    <Box>
      <TableContainer id="tokens-list" mb={50}>
        <TableHeader {...tableHeaderProps} />
        {hasNfts ? (
          nftsInTheCollection.map(item => (
            <NftItem
              key={`${item.contract}-${item.nft.tokenId}`}
              contract={item.contract}
              tokenId={item.nft.tokenId}
              account={account}
              currencyId={item.nft.currencyId}
              numberOfNfts={item.nftsNumber}
              onClick={onOpenCollection}
            />
          ))
        ) : (
          <EmptyCollection
            currencyName={account.currency.name}
            collectionType={CollectibleTypeEnum.NFT}
          >
            <Button small primary onClick={onReceive} icon>
              <Flex alignItems={"center"}>
                <Icons.ArrowDown size="XS" />
                <Box>{t("NFT.collections.receiveCTA")}</Box>
              </Flex>
            </Button>
          </EmptyCollection>
        )}
        {displayShowMore && <ShowMore onShowMore={onShowMore} />}
      </TableContainer>
    </Box>
  );
}

const NftCollection: React.FC<Props> = ({ account }) => {
  return <View {...useNftCollectionModel({ account })} account={account} />;
};

export default NftCollection;
