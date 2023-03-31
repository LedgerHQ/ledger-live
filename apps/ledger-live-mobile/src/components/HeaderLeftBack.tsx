import React, { useCallback } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { TouchableOpacity } from "react-native";
import HeaderBackImage from "./HeaderBackImage";

export type Props = {
  onBackPress?: () => void;
};

/**
 * Back arrow button that should be used (when needed) as the back arrow on the left of the header
 *
 * @param onBackPress: function called when user presses on back arrow. If undefined:
 *   default `navigation.goBack` is used.
 */
export default function HeaderLeftBack({ onBackPress }: Props) {
  const navigation = useNavigation();

  const handlePress = useCallback(() => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  }, [navigation, onBackPress]);

  return (
    <Flex pl={4}>
      <TouchableOpacity onPress={handlePress}>
        <HeaderBackImage />
      </TouchableOpacity>
    </Flex>
  );
}
