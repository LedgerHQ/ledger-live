import React, { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NFTMetadata } from "@ledgerhq/types-live";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Box, Flex, Icons, Text } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "../../const";
import ExternalLinkIcon from "../../icons/ExternalLink";
import OpenSeaIcon from "../../icons/OpenSea";
import RaribleIcon from "../../icons/Rarible";
import GlobeIcon from "../../icons/Globe";
import QueuedDrawer from "../QueuedDrawer";
import { rgba } from "../../colors";
import HideNftDrawer from "./HideNftDrawer";
import { track, TrackScreen } from "../../analytics";
import { extractImageUrlFromNftMetadata } from "../CustomImage/imageUtils";

type Props = {
  links?: NFTMetadata["links"] | null;
  isOpen: boolean;
  onClose: () => void;
  nftMetadata?: NFTMetadata;
  nftId?: string;
  nftContract?: string;
};

const LinkTouchable = styled(TouchableOpacity)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const NftLink = ({
  style,
  leftIcon,
  rightIcon,
  title,
  subtitle,
  onPress,
  primary,
}: {
  style?: React.ComponentProps<typeof TouchableOpacity>["style"];
  leftIcon: React.ReactNode;
  rightIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: React.ComponentProps<typeof TouchableOpacity>["onPress"];
  primary?: boolean;
}) => (
  <LinkTouchable style={style} onPress={onPress}>
    <Flex flexDirection="row" alignItems="center">
      <Box mr={16}>{leftIcon}</Box>
      <Flex flexDirection="column">
        <Text
          fontWeight="semiBold"
          fontSize={16}
          color={primary ? "primary.c90" : "neutral.c100"}
        >
          {title}
        </Text>
        {subtitle && (
          <Text fontSize={13} color={primary ? "primary.c90" : "neutral.c100"}>
            {subtitle}
          </Text>
        )}
      </Flex>
    </Flex>
    {rightIcon}
  </LinkTouchable>
);

const NftLinksPanel = ({
  nftContract,
  nftId,
  links,
  isOpen,
  onClose,
  nftMetadata,
}: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const customImage = useFeature("customImage");
  const [bottomHideCollectionOpen, setBottomHideCollectionOpen] =
    useState(false);
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
              leftIcon={<OpenSeaIcon size={36} />}
              title={`${t("nft.viewerModal.viewOn")} OpenSea`}
              rightIcon={
                <ExternalLinkIcon size={20} color={colors.neutral.c100} />
              }
              onPress={handleOpenOpenSea}
            />,
          ]
        : []),
      ...(links?.rarible && !areRaribleOpenseaDisabled
        ? [
            <NftLink
              style={styles.sectionMargin}
              leftIcon={<RaribleIcon size={36} />}
              title={`${t("nft.viewerModal.viewOn")} Rarible`}
              rightIcon={
                <ExternalLinkIcon size={20} color={colors.neutral.c100} />
              }
              onPress={handleOpenRarible}
            />,
          ]
        : []),
    ];

    const bottomSection = [
      [
        <NftLink
          primary
          leftIcon={
            <View
              style={[
                styles.roundIconContainer,
                { backgroundColor: rgba(colors.primary.c90, 0.1) },
              ]}
            >
              <Icons.EyeNoneMedium size={16} color={colors.primary.c90} />
            </View>
          }
          title={t("nft.viewerModal.hide")}
          onPress={hide}
        />,
      ],
      ...(links?.explorer
        ? [
            <NftLink
              primary
              leftIcon={
                <View
                  style={[
                    styles.roundIconContainer,
                    { backgroundColor: rgba(colors.primary.c90, 0.1) },
                  ]}
                >
                  <GlobeIcon size={16} color={colors.primary.c90} />
                </View>
              }
              title={t("nft.viewerModal.viewInExplorer")}
              onPress={handleOpenExplorer}
            />,
          ]
        : []),
      ...(showCustomImageButton
        ? [
            <NftLink
              primary
              title={t("customImage.nftEntryPointButtonLabel")}
              leftIcon={
                <View
                  style={[
                    styles.roundIconContainer,
                    { backgroundColor: rgba(colors.primary.c90, 0.1) },
                  ]}
                >
                  <Icons.BracketsMedium size={16} color={colors.primary.c90} />
                </View>
              }
              onPress={handlePressCustomImage}
            />,
          ]
        : []),
    ];

    const renderSection = (section: React.ReactNode[], keyPrefix: string) =>
      section.map((item, index, arr) => (
        <React.Fragment key={keyPrefix + index}>
          {item}
          {index !== arr.length - 1 ? (
            <View style={styles.sectionMargin} />
          ) : null}
        </React.Fragment>
      ));

    return (
      <>
        {renderSection(topSection, "top")}
        {topSection.length > 0 && bottomSection.length > 0 ? (
          <Box
            borderBottomWidth={"1px"}
            borderBottomColor={"neutral.c30"}
            mb={7}
          />
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
    <QueuedDrawer
      style={[
        styles.root,
        {
          backgroundColor: colors.background.drawer,
        },
      ]}
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
    >
      <TrackScreen
        category="NFT settings"
        refreshSource={false}
        type="drawer"
      />
      {content}
      <HideNftDrawer
        nftContract={nftContract}
        nftId={nftId}
        collection={String(nftMetadata?.tokenName)}
        isOpened={bottomHideCollectionOpen}
        onClose={closeHideModal}
      />
    </QueuedDrawer>
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
  roundIconContainer: {
    height: 36,
    width: 36,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#DFDFDF",
    marginBottom: 24,
  },
});

export default memo(NftLinksPanel);
