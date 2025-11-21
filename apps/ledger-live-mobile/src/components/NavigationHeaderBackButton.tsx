import { Flex, Icons } from "@ledgerhq/native-ui";
import { NavigationProp, NavigationState, useNavigation } from "@react-navigation/native";
import React from "react";
import Touchable from "./Touchable";

type Props = {
  /**
   * Function called when user presses on the back arrow.
   * If undefined: default `navigation.goBack` is used.
   */
  onPress?: (
    nav: Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & {
      getState(): NavigationState | undefined;
    },
  ) => void;
};

export const NavigationHeaderBackImage = () => (
  <Flex>
    <Icons.ArrowLeft />
  </Flex>
);

/**
 * Back arrow button that should be used as the back arrow on the left of the react-navigation header.
 */
export const NavigationHeaderBackButton: React.FC<Props> = React.memo(({ onPress }) => {
  const navigation = useNavigation();

  function handlePress() {
    if (onPress) {
      onPress(navigation);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }

  return (
    <Touchable testID="navigation-header-back-button" onPress={handlePress}>
      <NavigationHeaderBackImage />
    </Touchable>
  );
});
