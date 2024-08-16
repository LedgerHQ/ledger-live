import React from "react";
import { Text } from "@ledgerhq/native-ui";

type ItemStyle = {
  badgeColor: string;
  borderColor: string;
  backgroundColor: string;
};

type Props = {
  text: string;
  style: ItemStyle;
};

const Label: React.FC<Props> = ({ text, style }) => {
  const { badgeColor, borderColor, backgroundColor } = style;
  return (
    <Text
      role="banner"
      fontSize="9px"
      width="auto"
      paddingX={2}
      paddingY={1}
      borderWidth={1}
      borderRadius={3}
      borderStyle={"solid"}
      flexGrow={0}
      flexShrink={0}
      overflow={"hidden"}
      textTransform="uppercase"
      color={badgeColor}
      borderColor={borderColor}
      backgroundColor={backgroundColor}
      fontWeight="semiBold"
      marginLeft={3}
    >
      {text}
    </Text>
  );
};

export default Label;
