import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RectButton } from "react-native-gesture-handler";
import { useTheme } from "styled-components/native";
import { TouchableOpacity } from "react-native";
import styled from "@ledgerhq/native-ui/components/styled";
import { useNavigation } from "@react-navigation/native";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NavigatorName, ScreenName } from "../../const";

const StyledBox = styled(TouchableOpacity)`
  background-color: ${props => props.theme.colors.background.main};
  margin-bottom: 8;
  border-radius: 4;
  width: 160;
  height: 160;
  border-width: 1;
  border-color: ${props => props.theme.colors.neutral.c60};
`;

const PRE_SELECTED_CRYPTOS = ["ethereum", "polygon"];

export const AddNewItem = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const navigateToReceive = useCallback(
    () =>
      navigation.navigate(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveSelectCrypto,
        params: {
          filterCurrencyIds: PRE_SELECTED_CRYPTOS,
        },
      }),
    [navigation],
  );
  return (
    <StyledBox
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      borderStyle="dashed"
      onPress={navigateToReceive}
    >
      <Flex flexDirection="column" alignItems="center" justifyContent="center">
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
    </StyledBox>
  );
};
