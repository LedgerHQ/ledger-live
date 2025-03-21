import React, { useMemo } from "react";
import { useNftCollectionsModel } from "./useNftCollectionsModel";
import { Box, Icons, Flex } from "@ledgerhq/react-ui";
import TableContainer from "~/renderer/components/TableContainer";
import TableHeader from "LLD/features/Collectibles/components/Collection/TableHeader";
import { Account } from "@ledgerhq/types-live";
import { useNftMetadata } from "@ledgerhq/live-nft-react";
import TableRow from "LLD/features/Collectibles/components/Collection/TableRow";
import EmptyCollection from "LLD/features/Collectibles/components/Collection/EmptyCollection";
import { CollectibleTypeEnum } from "LLD/features/Collectibles/types/enum/Collectibles";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import ShowMore from "LLD/features/Collectibles/components/Collection/ShowMore";
import { FieldStatus } from "LLD/features/Collectibles/types/enum/DetailDrawer";
import CollectionContextMenu from "LLD/components/ContextMenu/CollectibleContextMenu";
import HeaderActions from "LLD/features/Collectibles/components/Collection/HeaderActions";
import {
  TableHeaderProps,
  TableHeaderTitleKey as TitleKey,
} from "LLD/features/Collectibles/types/Collection";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

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
        tokenName={metadata?.tokenName || metadata?.nftName || ""}
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
  const lldSolanaNfts = useFeature("lldSolanaNfts");
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
            hidden: account.currency.id === "solana" && lldSolanaNfts?.enabled,
          },
          {
            element: <HeaderActions textKey="NFT.collections.galleryCTA" />,
            action: onOpenGallery,
          },
        ]
      : [];
  }, [hasNfts, onReceive, onOpenGallery, lldSolanaNfts, account.currency.id]);

  const tableHeaderProps: TableHeaderProps = {
    titleKey: TitleKey.NFTCollections,
    actions,
  };

  if (account.currency.id === "solana" && !lldSolanaNfts?.enabled) return null;

  return (
    <Box data-testid="nft-collections">
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
            hideLearnMore={lldSolanaNfts?.enabled}
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

const NftCollections: React.FC<Props> = ({ account }) => {
  return <View {...useNftCollectionsModel({ account })} account={account} />;
};

export default NftCollections;
