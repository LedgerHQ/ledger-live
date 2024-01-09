import React, { memo, useCallback } from "react";
import { Linking } from "react-native";
import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Button from "~/components/wrappedUi/Button";
import { urls } from "~/utils/urls";
import Link from "~/components/wrappedUi/Link";
import ReceiveNFTsModal from "./ReceiveNFTsModal";
import { useReceiveNFTsModal } from "./ReceiveNFTsModal.hook";
import { track, TrackScreen } from "~/analytics";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";

const NftGalleryEmptyState = () => {
  const { t } = useTranslation();
  const { openModal, closeModal, isModalOpened } = useReceiveNFTsModal({
    hasNFTS: false,
  });

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const openSupportLink = useCallback(() => {
    track("url_clicked", {
      name: "How to deposit from Metamask",
      url: urls.nft.howToSecure,
    });
    Linking.openURL(urls.nft.howToSecure);
  }, []);

  return (
    <Flex flex={1} alignItems="center" justifyContent="center">
      <TrackScreen
        category={readOnlyModeEnabled ? "NFT Gallery Start Read-only" : "NFT Gallery Start"}
      />
      <Text variant={"h1Inter"} fontWeight={"semiBold"} color={"neutral.c100"} mb={6}>
        {t("wallet.nftGallery.empty.title")}
      </Text>
      <Text variant={"bodyLineHeight"} fontWeight={"semiBold"} color={"neutral.c80"} mb={8}>
        {t("wallet.nftGallery.empty.subtitle")}
      </Text>
      <Button
        testID="wallet-nft-gallery-receive-nft-button"
        onPress={openModal}
        size={"large"}
        type={"main"}
        mb={8}
      >
        {t("wallet.nftGallery.empty.receive")}
      </Button>
      <Link
        onPress={openSupportLink}
        size={"medium"}
        Icon={IconsLegacy.ExternalLinkMedium}
        iconPosition="right"
      >
        {t("wallet.nftGallery.empty.supportLink")}
      </Link>

      <ReceiveNFTsModal isOpened={isModalOpened} onClose={closeModal} />
    </Flex>
  );
};

export default memo(NftGalleryEmptyState);
