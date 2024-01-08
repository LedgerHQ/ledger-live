import React, { memo, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Box, Flex, IconsLegacy } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import AddAccount from "./AddAccount";
import Touchable from "~/components/Touchable";
import { ScreenName } from "~/const";
import { track } from "~/analytics";

type Props = {
  readOnly?: boolean;
  currencyId?: string;
};

function AccountsNavigationHeader({ readOnly, currencyId }: Props) {
  const navigation = useNavigation();

  const handleOnReadOnlyAddAccountPress = useCallback(() => {
    track("button_clicked", {
      button: "Add Account '+'",
      page: "Accounts",
    });
    navigation.navigate(ScreenName.NoDeviceWallScreen);
  }, [navigation]);

  const goBack = useCallback(() => {
    track("button_clicked", {
      button: "Back",
      page: "Accounts",
    });
    navigation.goBack();
  }, [navigation]);

  return (
    <Flex p={6} flexDirection="row" alignItems="center">
      <Box mr={3} flex={1}>
        <TouchableOpacity onPress={goBack}>
          <IconsLegacy.ArrowLeftMedium size={24} />
        </TouchableOpacity>
      </Box>
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
              <IconsLegacy.PlusMedium size={20} color={"neutral.c00"} />
            </Flex>
          </Touchable>
        ) : (
          <AddAccount currencyId={currencyId} />
        )}
      </Flex>
    </Flex>
  );
}

export default memo<Props>(AccountsNavigationHeader);
