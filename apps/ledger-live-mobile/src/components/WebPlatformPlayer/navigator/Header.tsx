import React from "react";
import { TouchableOpacity } from "react-native";
import { Flex, Icon } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import HeaderTitle from "../../HeaderTitle";

export function BrowserHeader({
  url,
  onPressInfo,
  infoDisabled,
}: {
  url: string;
  onPressInfo: () => void;
  infoDisabled: boolean;
}) {
  const navigation = useNavigation();

  return (
    <Flex flexDirection="row" height={50} alignItems="center">
      <Flex justifyContent={"center"} flex={1}>
        <HeaderTitle color="neutral.c70">{url}</HeaderTitle>
      </Flex>

      <Flex justifyContent="center" flexDirection="row">
        <TouchableOpacity disabled={infoDisabled} onPress={onPressInfo}>
          <Flex
            alignItems="center"
            justifyContent="center"
            height={40}
            width={40}
          >
            <Icon name="Info" color="neutral.c70" size={20} />
          </Flex>
        </TouchableOpacity>

        <TouchableOpacity onPress={navigation.goBack}>
          <Flex
            alignItems="center"
            justifyContent="center"
            height={40}
            width={40}
          >
            <Icon name="Close" color="neutral.c100" size={20} />
          </Flex>
        </TouchableOpacity>
      </Flex>
    </Flex>
  );
}
