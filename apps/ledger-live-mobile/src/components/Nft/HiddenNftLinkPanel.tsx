import { Flex } from "@ledgerhq/native-ui";
import React, { FC } from "react";
import QueuedDrawer from "../QueuedDrawer";
import { TrackScreen } from "../../analytics";
import { NFTMetadata, ProtoNFT } from "@ledgerhq/types-live/lib/nft";
import NftLink, { NftLinkRoundIcon } from "./NftLink";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import styled from "styled-components/native";
import { track } from "../../analytics";
import { ScreenName } from "../../const/navigation";

const DRAWER_NAME = "Hidden NFT List Context";

interface Props {
  readonly onClose: () => void;
  readonly isOpen: boolean;
  readonly metaData?: NFTMetadata;
  readonly nft: ProtoNFT;
  readonly onUnhide: () => void;
}

const HiddenNftLinkPanel: FC<Props> = ({ onClose, isOpen, onUnhide, metaData, nft }) => {
  const { t } = useTranslation();
  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose}>
      <TrackScreen category={DRAWER_NAME} refreshSource={false} type="drawer" />
      <LinkContainer>
        <NftLink
          primary
          leftIcon={<NftLinkRoundIcon icon="EyeMedium" />}
          title={t("nft.viewerModal.unhide")}
          onPress={() => {
            track("button_clicked", {
              button: "Unhide NFT Collection",
              drawer: DRAWER_NAME,
              page: ScreenName.HiddenNftCollections,
              collection_contract: nft.contract,
            });
            onUnhide();
          }}
        />
        {metaData?.links.explorer ? (
          <NftLink
            primary
            leftIcon={<NftLinkRoundIcon icon="GlobeMedium" />}
            title={t("nft.viewerModal.viewInExplorer")}
            onPress={() => {
              track("button_clicked", {
                button: "View in Explorer",
                drawer: DRAWER_NAME,
                page: ScreenName.HiddenNftCollections,
                collection_contract: nft.contract,
              });
              Linking.openURL(metaData.links.explorer);
            }}
          />
        ) : null}
      </LinkContainer>
    </QueuedDrawer>
  );
};

export default HiddenNftLinkPanel;

const LinkContainer = styled(Flex)`
  gap: 30px;
`;
