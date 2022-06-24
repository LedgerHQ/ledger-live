import React, { memo, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import AddAccount from "./AddAccount";
import { Box, Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Touchable from "../../components/Touchable";
import { ScreenName } from "../../const";

type Props = {
  readOnly?: boolean;
};

function AccountsNavigationHeader({ readOnly }: Props) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleOnReadOnlyAddAccountPress = useCallback(() => {
    navigation.navigate(ScreenName.NoDeviceWallScreen);
  }, [navigation]);

  return (
    <Flex p={6} flexDirection="row" alignItems="center">
      <Box mr={3}>
        <TouchableOpacity onPress={navigation.goBack}>
          <Icons.ArrowLeftMedium size={24} />
        </TouchableOpacity>
      </Box>
      <Flex
        height={30}
        flexDirection="column"
        justifyContent="center"
        mt={4}
        mb={3}
        flex={1}
      >
        <Text variant="h1">{t("distribution.title")}</Text>
      </Flex>
      <Flex flexDirection="row" alignItems={"center"}>
        {/**
         <Box mr={7}>
         {!flattenedAccounts.length ? null : <AccountOrder />}
         </Box>
         */}

        {readOnly ? (
          <Touchable onPress={handleOnReadOnlyAddAccountPress}>
            <Flex
              bg={"neutral.c100"}
              width={"32px"}
              height={"32px"}
              alignItems={"center"}
              justifyContent={"center"}
              borderRadius={32}
            >
              <Icons.PlusMedium size={20} color={"neutral.c00"} />
            </Flex>
          </Touchable>
        ) : (
          <AddAccount />
        )}
      </Flex>
    </Flex>
  );
}

export default memo<Props>(AccountsNavigationHeader);
