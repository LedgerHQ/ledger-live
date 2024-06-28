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

export type NftsInTheCollections = {
  contract: string;
  nft: ProtoNFT;
  nftsNumber: number;
  isLoading: boolean;
  onClick: () => () => void;
};

type ViewProps = {
  tableHeaderProps: TableHeaderProps;
  nftsInTheCollection: NftsInTheCollections[];
  account: Account;
  onReceive: () => void;
};

type NftItemProps = {
  contract: string;
  tokenId: string;
  currencyId: string;
  numberOfNfts: number;
  isLoading: boolean;
};

type Props = {
  account: Account;
  collectionAddress: string;
};

const NftItem: React.FC<NftItemProps> = ({
  contract,
  tokenId,
  currencyId,
  numberOfNfts,
  isLoading,
}) => {
  const { metadata } = useNftMetadata(contract, tokenId, currencyId);
  return (
    <TableRow
      isLoading={isLoading}
      tokenName={metadata?.tokenName || tokenId}
      numberOfNfts={numberOfNfts}
      onClick={() => () => {}}
      media={{
        useFallback: false,
        contentType: "image",
        uri: metadata?.medias.preview.uri,
        mediaType: metadata?.medias.preview.mediaType,
        setUseFallback: () => null,
      }}
    />
  );
};

function View({ tableHeaderProps, nftsInTheCollection, account, onReceive }: ViewProps) {
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
              isLoading={item.isLoading}
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
      </TableContainer>
    </Box>
  );
}

const NftCollection: React.FC<Props> = ({ account, collectionAddress }) => {
  return <View {...useNftCollectionModel({ account, collectionAddress })} account={account} />;
};

export default NftCollection;
