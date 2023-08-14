import React, { ReactNode } from "react";
import { RectButton } from "react-native-gesture-handler";
import { Flex } from "@ledgerhq/native-ui";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import { StyleProp, ViewStyle } from "react-native";

export type Props = FlexBoxProps & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

const Card = ({ children, onPress, ...props }: Props) => {
  const content = () => (
    <Flex borderRadius={4} backgroundColor="background.main" {...props}>
      {children}
    </Flex>
  );

  if (onPress) {
    return <RectButton onPress={onPress}>{content()}</RectButton>;
  }

  return content();
};

export default Card;
