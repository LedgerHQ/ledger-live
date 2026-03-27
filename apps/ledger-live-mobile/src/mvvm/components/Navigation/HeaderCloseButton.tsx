import React from "react";
import { useNavigation, ParamListBase } from "@react-navigation/native";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

type Props = {
  onClose?: () => void;
};

function NavigationHeaderCloseButton({ onClose }: Readonly<Props>) {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const handlePress = () => {
    if (onClose) {
      onClose();
    } else {
      navigation.popToTop();
    }
  };

  return (
    <IconButton
      appearance="no-background"
      lx={buttonStyle}
      size="md"
      icon={Close}
      testID="navigation-header-close-button"
      accessibilityLabel="Close"
      onPress={handlePress}
    />
  );
}

const buttonStyle: LumenViewStyle = {
  marginRight: "-s4",
};

export default NavigationHeaderCloseButton;
