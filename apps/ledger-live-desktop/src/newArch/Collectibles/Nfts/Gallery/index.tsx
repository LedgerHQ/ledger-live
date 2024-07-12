import React from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import useNftGalleryModel from "./useNftGalleryModel";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import { Flex, Icons } from "@ledgerhq/react-ui";
import TableLayout from "../../components/TableLayout";
import { useTranslation } from "react-i18next";
import { Account } from "@ledgerhq/types-live";
import styled from "styled-components";
import Spinner from "~/renderer/components/Spinner";
import LazyCollection from "./components/LazyCollection";

type ViewProps = ReturnType<typeof useNftGalleryModel>;

const Footer = styled.footer`
  height: 20px;
`;

const SpinnerContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;
const SpinnerBackground = styled.div`
  background: ${p => p.theme.colors.palette.background.paper};
  border-radius: 100%;
  padding: 2px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${p => p.theme.colors.palette.background.paper};
`;

function View({
  account,
  listFooterRef,
  maxVisibleNFTs,
  collections,
  onSelectCollection,
  onSend,
}: ViewProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = React.useState(false);

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
      <LazyCollection
        maxVisibleNFTs={maxVisibleNFTs}
        collections={collections}
        account={account as Account}
        setIsLoading={setIsLoading}
        onSelectCollection={onSelectCollection}
      />

      <Footer ref={listFooterRef}>
        {isLoading ? (
          <SpinnerContainer>
            <SpinnerBackground>
              <Spinner size={14} />
            </SpinnerBackground>
          </SpinnerContainer>
        ) : (
          <Box alignItems="center">
            <Text ff="Inter" fontSize={3}>
              {t("operationList.noMoreOperations")}
            </Text>
          </Box>
        )}
      </Footer>
    </Flex>
  );
}

const NftGallery: React.FC<{}> = () => <View {...useNftGalleryModel()} />;

export default NftGallery;
