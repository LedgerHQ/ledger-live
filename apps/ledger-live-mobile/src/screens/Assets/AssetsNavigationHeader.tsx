import React, { memo, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Flex, IconsLegacy } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import AddAccount from "../Accounts/AddAccount";
import Touchable from "~/components/Touchable";
import { ScreenName } from "~/const";
import { track } from "~/analytics";

type Props = {
  readOnly?: boolean;
};

function AssetsNavigationHeader({ readOnly }: Props) {
  const navigation = useNavigation();

  const handleOnReadOnlyAddAccountPress = useCallback(() => {
    track("button_clicked", {
      button: "Add Account '+'",
      page: "Assets",
    });
    navigation.navigate(ScreenName.NoDeviceWallScreen);
  }, [navigation]);

  const goBack = useCallback(() => {
    track("button_clicked", {
      button: "Back",
      page: "Assets",
    });
    navigation.goBack();
  }, [navigation]);

  return (
    <Flex p={6} flexDirection="row" alignItems="center">
      <Flex mr={3} flex={1}>
        <TouchableOpacity onPress={goBack}>
          <IconsLegacy.ArrowLeftMedium size={24} />
        </TouchableOpacity>
      </Flex>
      <Flex flexDirection="row" alignItems={"center"}>
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
          <AddAccount />
        )}
      </Flex>
    </Flex>
  );
}

export default memo<Props>(AssetsNavigationHeader);
