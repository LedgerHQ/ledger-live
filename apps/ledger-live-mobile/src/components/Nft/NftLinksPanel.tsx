import React, { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { NFTMediaSize, NFTMetadata } from "@ledgerhq/types-live";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Icons } from "@ledgerhq/native-ui";
import { getMetadataMediaTypes } from "../../logic/nft";
import { NavigatorName, ScreenName } from "../../const";
import ExternalLinkIcon from "../../icons/ExternalLink";
import OpenSeaIcon from "../../icons/OpenSea";
import RaribleIcon from "../../icons/Rarible";
import GlobeIcon from "../../icons/Globe";
import BottomModal from "../BottomModal";
import { rgba } from "../../colors";
import LText from "../LText";

type Props = {
  links?: NFTMetadata["links"] | null;
  isOpen: boolean;
  onClose: () => void;
  nftMetadata?: NFTMetadata;
};

const NftLink = ({
  style,
  leftIcon,
  rightIcon,
  title,
  subtitle,
  onPress,
}: {
  style?: React.ComponentProps<typeof TouchableOpacity>["style"];
  leftIcon: React.ReactNode;
  rightIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: React.ComponentProps<typeof TouchableOpacity>["onPress"];
}) => (
  <TouchableOpacity style={[styles.section, style]} onPress={onPress}>
    <View style={styles.sectionBody}>
      <View style={styles.icon}>{leftIcon}</View>
      <View>
        <LText semiBold style={styles.sectionTitle}>
          {title}
        </LText>
        {subtitle && <LText style={styles.sectionSubTitle}>{subtitle}</LText>}
      </View>
    </View>
    {rightIcon}
  </TouchableOpacity>
);

const NftLinksPanel = ({ links, isOpen, onClose, nftMetadata }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const customImage = useFeature("customImage");
  const areRaribleOpenseaDisabled =
    useFeature("disableNftRaribleOpensea")?.enabled && Platform.OS === "ios";

  const mediaTypes = useMemo(
    () => (nftMetadata ? getMetadataMediaTypes(nftMetadata) : null),
    [nftMetadata],
  );
  const mediaSizeForCustomImage = mediaTypes
    ? (["big", "preview"] as NFTMediaSize[]).find(
        size => mediaTypes[size] === "image",
      )
    : null;
  const customImageUri =
    (mediaSizeForCustomImage &&
      nftMetadata?.medias?.[mediaSizeForCustomImage]?.uri) ||
    null;

  const showCustomImageButton = customImage?.enabled && !!customImageUri;

  const handleOpenOpenSea = useCallback(() => {
    links?.opensea && Linking.openURL(links?.opensea);
  }, [links?.opensea]);

  const handleOpenRarible = useCallback(() => {
    links?.rarible && Linking.openURL(links?.rarible);
  }, [links?.rarible]);

  const handleOpenExplorer = useCallback(() => {
    links?.explorer && Linking.openURL(links?.explorer);
  }, [links?.explorer]);

  const handlePressCustomImage = useCallback(() => {
    if (!customImageUri) return;
    navigation.navigate(NavigatorName.CustomImage, {
      screen: ScreenName.CustomImageStep1Crop,
      params: {
        imageUrl: customImageUri,
        device: null,
      },
    });
    onClose && onClose();
  }, [navigation, onClose, customImageUri]);

  const content = useMemo(() => {
    const topSection = [
      ...(links?.opensea && !areRaribleOpenseaDisabled
        ? [
            <NftLink
              leftIcon={<OpenSeaIcon size={36} />}
              title={`${t("nft.viewerModal.viewOn")} OpenSea`}
              rightIcon={<ExternalLinkIcon size={20} color={colors.grey} />}
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
              rightIcon={<ExternalLinkIcon size={20} color={colors.grey} />}
              onPress={handleOpenRarible}
            />,
          ]
        : []),
    ];

    const bottomSection = [
      ...(links?.explorer
        ? [
            <NftLink
              leftIcon={
                <View
                  style={[
                    styles.roundIconContainer,
                    { backgroundColor: rgba(colors.live, 0.1) },
                  ]}
                >
                  <GlobeIcon size={16} color={colors.live} />
                </View>
              }
              title={t("nft.viewerModal.viewInExplorer")}
              rightIcon={<ExternalLinkIcon size={20} color={colors.grey} />}
              onPress={handleOpenExplorer}
            />,
          ]
        : []),
      ...(showCustomImageButton
        ? [
            <NftLink
              title={"Custom image"} // TODO: there is no design nor wording for this for now
              leftIcon={
                <View
                  style={[
                    styles.roundIconContainer,
                    { backgroundColor: rgba(colors.live, 0.1) },
                  ]}
                >
                  <Icons.BracketsMedium size={16} color={colors.live} />
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
          <View style={styles.hr} />
        ) : null}
        {renderSection(bottomSection, "bottom")}
      </>
    );
  }, [
    links,
    colors,
    t,
    showCustomImageButton,
    handleOpenExplorer,
    handleOpenOpenSea,
    handleOpenRarible,
    handlePressCustomImage,
  ]);

  return (
    <BottomModal
      style={[
        styles.root,
        {
          backgroundColor: colors.card,
        },
      ]}
      isOpened={isOpen}
      onClose={onClose}
    >
      {content}
    </BottomModal>
  );
};

const styles = StyleSheet.create({
  root: {
    position: "relative",
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 60,
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionBody: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
  },
  sectionSubTitle: {
    fontSize: 13,
  },
  sectionMargin: {
    marginBottom: 30,
  },
  sectionMarginTop: {
    marginTop: 30,
  },
  icon: {
    marginRight: 16,
  },
  roundIconContainer: {
    height: 36,
    width: 36,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#DFDFDF",
    marginBottom: 24,
  },
});

export default memo(NftLinksPanel);
