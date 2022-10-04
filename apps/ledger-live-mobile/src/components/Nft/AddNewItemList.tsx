import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { RectButton } from "react-native-gesture-handler";
import { useTheme } from "styled-components/native";
import { TouchableOpacity } from "react-native";
import styled from "@ledgerhq/native-ui/components/styled";

const StyledBox = styled(TouchableOpacity)`
  background-color: ${props => props.theme.colors.background.main};
  margin-bottom: 8;
  border-radius: 4;
  width: 160;
  height: 160;
  border-width: 1;
  border-color: ${props => props.theme.colors.neutral.c60};
`;

export const AddNewItem = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <StyledBox
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      borderStyle="dashed"
    >
      <RectButton onPress={() => console.log("Add new NFT")}>
        <Flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <Icons.PlusMedium size={24} color={colors.neutral.c100} />
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
      </RectButton>
    </StyledBox>
  );
};
