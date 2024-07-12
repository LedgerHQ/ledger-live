import React from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import useNftGalleryModel from "./useNftGalleryModel";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import { Flex, Icons } from "@ledgerhq/react-ui";
import TableLayout from "../../components/TableLayout";
import { useTranslation } from "react-i18next";
import { CollectionName } from "../../components";
import TokenList from "./components/TokensList";
import { Account } from "@ledgerhq/types-live";
import styled from "styled-components";

type ViewProps = ReturnType<typeof useNftGalleryModel>;

const ClickableCollectionName = styled(Box)`
  &:hover {
    cursor: pointer;
  }
`;

function View({ account, nftsByCollection, onSelectCollection, onSend }: ViewProps) {
  const { t } = useTranslation();

  return (
    <Flex pb={16} flexDirection={"column"}>
      <TrackPage category="Page" name="NFT Gallery" />
      <Box horizontal alignItems="center" mb={16} width={"100%"}>
        <Box flex={1}>
          <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={22}>
            {t("NFT.gallery.title")}
          </Text>
        </Box>
        <Button small primary icon onClick={onSend}>
          <Box horizontal flow={1} alignItems="center">
            <Icons.ArrowUp size={"S"} />
            <Box>{t("NFT.gallery.collection.header.sendCTA")}</Box>
          </Box>
        </Button>
      </Box>
      <TableLayout />
      {Object.entries(nftsByCollection).map(([collectionKey, nftsInCollection]) => (
        <React.Fragment key={collectionKey}>
          <ClickableCollectionName
            mb={2}
            onClick={() => onSelectCollection(nftsInCollection[0].contract)}
          >
            <CollectionName nft={nftsInCollection[0]} account={account} showHideMenu />
          </ClickableCollectionName>
          <TokenList account={account as Account} nfts={nftsInCollection} />
        </React.Fragment>
      ))}
      <Box alignItems="center">
        <Text ff="Inter" fontSize={3}>
          {t("operationList.noMoreOperations")}
        </Text>
      </Box>
    </Flex>
  );
}

const NftGallery: React.FC<{}> = () => <View {...useNftGalleryModel()} />;

export default NftGallery;
