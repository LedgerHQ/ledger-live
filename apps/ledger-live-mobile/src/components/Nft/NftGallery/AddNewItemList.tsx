// Fixed TypeScript 5.9 styled-components compatibility issues line by line
import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { TouchableOpacity } from "react-native";
import styled from "@ledgerhq/native-ui/components/styled";
import ReceiveNFTsModal from "~/screens/Nft/NftGallery/ReceiveNFTsModal";
import { useReceiveNFTsModal } from "~/screens/Nft/NftGallery/ReceiveNFTsModal.hook";

/* eslint-disable @typescript-eslint/no-explicit-any */
const StyledTouchableOpacity = styled(TouchableOpacity)`
  background-color: ${(props: any) => props.theme.colors.background.main};
  margin-bottom: 8px;
  border-radius: 8px;
  height: 160px;
  border-width: 1px;
  border-color: ${(props: any) => props.theme.colors.neutral.c60};
  border-style: dashed;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const AddNewItem = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { openModal, closeModal, isModalOpened } = useReceiveNFTsModal({
    hasNFTS: true,
  });

  return (
    <StyledTouchableOpacity testID="wallet-nft-gallery-add-new-list-item" onPress={openModal}>
      <Flex flexDirection="column" alignItems="center" justifyContent="center">
        <IconsLegacy.PlusMedium size={24} color={colors.neutral.c100} />
        <Text
          variant="body"
          fontWeight="semiBold"
          color={colors.neutral.c100}
          mt={2}
          fontSize={14}
          lineHeight="18px"
        >
          {t("nft.gallery.addNew")}
        </Text>
      </Flex>

      <ReceiveNFTsModal isOpened={isModalOpened} onClose={closeModal} />
    </StyledTouchableOpacity>
  );
};
