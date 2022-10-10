import React, { memo, useCallback } from "react";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import Button from "../../../components/wrappedUi/Button";
import { urls } from "../../../config/urls";
import Link from "../../../components/wrappedUi/Link";
import ReceiveNFTsModal from "./ReceiveNFTsModal";
import { useReceiveNFTsModal } from "./ReceiveNFTsModal.hook";

const NftGalleryEmptyState = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { openModal, closeModal, isModalOpened } = useReceiveNFTsModal();

  const openSupportLink = useCallback(
    () => Linking.openURL(urls.nft.howToSecure),
    [],
  );

  return (
    <Flex flex={1} alignItems={"center"} justifyContent={"center"}>
      <Text
        variant={"h1Inter"}
        fontWeight={"semiBold"}
        color={"neutral.c100"}
        mb={6}
      >
        {t("wallet.nftGallery.empty.title")}
      </Text>
      <Button onPress={openModal} size={"large"} type={"main"} mb={6}>
        {t("wallet.nftGallery.empty.receive")}
      </Button>
      <Link
        onPress={openSupportLink}
        Icon={Icons.ExternalLinkMedium}
        iconPosition="right"
      >
        {t("wallet.nftGallery.empty.supportLink")}
      </Link>

      <ReceiveNFTsModal
        navigation={navigation}
        isOpened={isModalOpened}
        onClose={closeModal}
      />
    </Flex>
  );
};

export default memo(NftGalleryEmptyState);
