import { Flex, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import Touchable from "./Touchable";

type Props = {
  /**
   * Function called when user presses on the back arrow.
   * If undefined: default `navigation.goBack` is used.
   */
  onPress?: () => void;
};

/**
 * Back arrow button that should be used as the back arrow on the left of the react-navigation header.
 */
export const HeaderBackButton: React.FC<Props> = React.memo(({ onPress }) => {
  const navigation = useNavigation();

  return (
    <Touchable onPress={() => (onPress ? onPress() : navigation.goBack())}>
      <Flex p={6}>
        <Icons.ArrowLeftMedium size={24} />
      </Flex>
    </Touchable>
  );
});
