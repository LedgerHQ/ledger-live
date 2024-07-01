import React from "react";
import { TableHeaderProps } from "../../types/Collection";
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

export type NftsInTheCollections = {
  contract: string;
  nft: ProtoNFT;
  nftsNumber: number;
  onClick: (collectionAddress: string) => void;
};

type ViewProps = {
  tableHeaderProps: TableHeaderProps;
  nftsInTheCollection: NftsInTheCollections[];
  account: Account;
  displayShowMore: boolean;
  onReceive: () => void;
  onOpenCollection: (collectionAddress: string) => void;
  onShowMore: () => void;
};

type NftItemProps = {
  contract: string;
  tokenId: string;
  currencyId: string;
  numberOfNfts: number;
  onClick: (collectionAddress: string) => void;
};

type Props = {
  account: Account;
};

const NftItem: React.FC<NftItemProps> = ({
  contract,
  tokenId,
  currencyId,
  numberOfNfts,

  onClick,
}) => {
  const { metadata, status } = useNftMetadata(contract, tokenId, currencyId);
  return (
    <TableRow
      isLoading={status === FieldStatus.Loading}
      tokenName={metadata?.tokenName || contract}
      numberOfNfts={numberOfNfts}
      onClick={() => onClick(contract)}
      media={{
        isLoading: status === FieldStatus.Loading,
        useFallback: true,
        contentType: "image",
        uri: metadata?.medias.preview.uri,
        mediaType: metadata?.medias.preview.mediaType,
        setUseFallback: () => null,
      }}
    />
  );
};

function View({
  tableHeaderProps,
  nftsInTheCollection,
  account,
  displayShowMore,
  onReceive,
  onOpenCollection,
  onShowMore,
}: ViewProps) {
  const { t } = useTranslation();
  const hasNfts = nftsInTheCollection.length > 0;

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
