import { Flex, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import Touchable from "./Touchable";

type Props = {
  onPress?: () => void;
};

export const NavigationHeaderBackImage = () => (
  <Flex p={6}>
    <Icons.ArrowLeftMedium size={24} />
  </Flex>
);

export const NavigationHeaderBackButton: React.FC<Props> = React.memo(
  ({ onPress }) => {
    const navigation = useNavigation();
    return (
      <Touchable onPress={() => (onPress ? onPress() : navigation.goBack())}>
        <NavigationHeaderBackImage />
      </Touchable>
    );
  },
);
