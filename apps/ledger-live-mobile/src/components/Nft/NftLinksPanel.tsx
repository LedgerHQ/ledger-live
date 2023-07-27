import React, { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NFTMetadata } from "@ledgerhq/types-live";
import { View, StyleSheet, Linking, Platform } from "react-native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Box } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "../../const";
import ExternalLinkIcon from "../../icons/ExternalLink";
import OpenSeaIcon from "../../icons/OpenSea";
import RaribleIcon from "../../icons/Rarible";
import QueuedDrawer from "../QueuedDrawer";
import HideNftDrawer from "./HideNftDrawer";
import { track, TrackScreen } from "../../analytics";
import { extractImageUrlFromNftMetadata } from "../CustomImage/imageUtils";
import NftLink, { NftLinkRoundIcon } from "./NftLink";

type Props = {
  links?: NFTMetadata["links"] | null;
  isOpen: boolean;
  onClose: () => void;
  nftMetadata?: NFTMetadata;
  nftId?: string;
  nftContract?: string;
};

const NftLinksPanel = ({ nftContract, nftId, links, isOpen, onClose, nftMetadata }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const customImage = useFeature("customImage");
  const [bottomHideCollectionOpen, setBottomHideCollectionOpen] = useState(false);
  const areRaribleOpenseaDisabled =
    useFeature("disableNftRaribleOpensea")?.enabled && Platform.OS === "ios";

  const customImageUri = extractImageUrlFromNftMetadata(nftMetadata);

  const showCustomImageButton = customImage?.enabled && !!customImageUri;

  const handleOpenOpenSea = useCallback(() => {
    track("button_clicked", {
      button: "OpenSea",
      drawer: "NFT settings",
      url: links?.opensea,
    });
    links?.opensea && Linking.openURL(links?.opensea);
  }, [links?.opensea]);

  const handleOpenRarible = useCallback(() => {
    track("url_clicked", {
      button: "Rarible",
      drawer: "NFT settings",
      url: links?.rarible,
    });
    links?.rarible && Linking.openURL(links?.rarible);
  }, [links?.rarible]);

  const handleOpenExplorer = useCallback(() => {
    track("button_clicked", {
      button: "View in Explorer",
      drawer: "NFT settings",
      url: links?.explorer,
    });
    links?.explorer && Linking.openURL(links?.explorer);
  }, [links?.explorer]);

  const hide = useCallback(() => {
    track("button_clicked", {
      button: "Hide NFT Collection",
      drawer: "NFT settings",
    });
    setBottomHideCollectionOpen(true);
  }, []);

  const handlePressCustomImage = useCallback(() => {
    if (!customImageUri) return;
    track("button_clicked", {
      button: "Set as Ledger Stax lockscreen picture",
      drawer: "NFT settings",
    });
    navigation.navigate(NavigatorName.CustomImage, {
      screen: ScreenName.CustomImagePreviewPreEdit,
      params: {
        imageUrl: customImageUri,
        isStaxEnabled: !!nftMetadata?.staxImage,
        device: null,
      },
    });
    onClose && onClose();
  }, [navigation, onClose, customImageUri, nftMetadata?.staxImage]);

  const content = useMemo(() => {
    const topSection = [
      ...(links?.opensea && !areRaribleOpenseaDisabled
        ? [
            <NftLink
              key="nftLinkOpenSea"
              leftIcon={<OpenSeaIcon size={36} />}
              title={`${t("nft.viewerModal.viewOn")} OpenSea`}
              rightIcon={<ExternalLinkIcon size={20} color={colors.neutral.c100} />}
              onPress={handleOpenOpenSea}
            />,
          ]
        : []),
      ...(links?.rarible && !areRaribleOpenseaDisabled
        ? [
            <NftLink
              key="nftLinkRarible"
              style={styles.sectionMargin}
              leftIcon={<RaribleIcon size={36} />}
              title={`${t("nft.viewerModal.viewOn")} Rarible`}
              rightIcon={<ExternalLinkIcon size={20} color={colors.neutral.c100} />}
              onPress={handleOpenRarible}
            />,
          ]
        : []),
    ];

    const bottomSection = [
      [
        <NftLink
          key="nftLinkHide"
          primary
          leftIcon={<NftLinkRoundIcon icon="EyeNoneMedium" />}
          title={t("nft.viewerModal.hide")}
          onPress={hide}
        />,
      ],
      ...(links?.explorer
        ? [
            <NftLink
              key="nftLinkViewInExplorer"
              primary
              leftIcon={<NftLinkRoundIcon icon="GlobeMedium" />}
              title={t("nft.viewerModal.viewInExplorer")}
              onPress={handleOpenExplorer}
            />,
          ]
        : []),
      ...(showCustomImageButton
        ? [
            <NftLink
              key="nftLinkCLS"
              primary
              title={t("customImage.nftEntryPointButtonLabel")}
              leftIcon={<NftLinkRoundIcon icon="PhotographMedium" />}
              onPress={handlePressCustomImage}
            />,
          ]
        : []),
    ];

    const renderSection = (section: React.ReactNode[], keyPrefix: string) =>
      section.map((item, index, arr) => (
        <React.Fragment key={keyPrefix + index}>
          {item}
          {index !== arr.length - 1 ? <View style={styles.sectionMargin} /> : null}
        </React.Fragment>
      ));

    return (
      <>
        {renderSection(topSection, "top")}
        {topSection.length > 0 && bottomSection.length > 0 ? (
          <Box borderBottomWidth={"1px"} borderBottomColor={"neutral.c30"} mb={7} />
        ) : null}
        {renderSection(bottomSection, "bottom")}
      </>
    );
  }, [
    links?.opensea,
    links?.rarible,
    links?.explorer,
    areRaribleOpenseaDisabled,
    t,
    colors.neutral.c100,
    colors.primary.c90,
    handleOpenOpenSea,
    handleOpenRarible,
    hide,
    handleOpenExplorer,
    showCustomImageButton,
    handlePressCustomImage,
  ]);

  const closeHideModal = () => {
    setBottomHideCollectionOpen(false);
  };

  return (
    <>
      <QueuedDrawer
        style={[
          styles.root,
          {
            backgroundColor: colors.background.drawer,
          },
        ]}
        isRequestingToBeOpened={isOpen && !bottomHideCollectionOpen}
        onClose={onClose}
      >
        <TrackScreen category="NFT settings" refreshSource={false} type="drawer" />
        {content}
      </QueuedDrawer>
      <HideNftDrawer
        nftContract={nftContract}
        nftId={nftId}
        collection={String(nftMetadata?.tokenName)}
        isOpened={bottomHideCollectionOpen}
        onClose={closeHideModal}
      />
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    position: "relative",
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 60,
  },
  sectionMargin: {
    marginBottom: 30,
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#DFDFDF",
    marginBottom: 24,
  },
});

export default memo(NftLinksPanel);
