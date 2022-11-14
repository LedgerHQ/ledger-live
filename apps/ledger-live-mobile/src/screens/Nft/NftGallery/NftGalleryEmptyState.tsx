import React, { memo, useCallback } from "react";
import { Linking } from "react-native";
import { Box, Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import Button from "../../../components/wrappedUi/Button";
import { urls } from "../../../config/urls";
import Link from "../../../components/wrappedUi/Link";
import ReceiveNFTsModal from "./ReceiveNFTsModal";
import { useReceiveNFTsModal } from "./ReceiveNFTsModal.hook";

const NftGalleryEmptyState = () => {
  const { t } = useTranslation();
  const { openModal, closeModal, isModalOpened } = useReceiveNFTsModal();

  const openSupportLink = useCallback(
    () => Linking.openURL(urls.nft.howToSecure),
    [],
  );

  return (
    <Flex flex={1}>
      <Box height={'100px'} bg={'yellow'} />
      <Box height={'100px'} bg={'red'} />
      <Box height={'100px'} bg={'blue'} />
      <Box height={'100px'} bg={'yellow'} />
      <Box height={'100px'} bg={'red'} />
      <Box height={'100px'} bg={'blue'} />
      <Box height={'100px'} bg={'yellow'} />
      <Box height={'100px'} bg={'red'} />
      <Box height={'100px'} bg={'blue'} />

    </Flex>
  );
};

export default memo(NftGalleryEmptyState);
