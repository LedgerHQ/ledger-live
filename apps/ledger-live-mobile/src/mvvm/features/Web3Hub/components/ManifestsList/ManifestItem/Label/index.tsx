import React, { ComponentProps } from "react";
import { Text } from "@ledgerhq/native-ui";

type Props = {
  text: string;
  style: Pick<
    ComponentProps<typeof Text>,
    "color" | "borderColor" | "backgroundColor" | "borderWidth"
  >;
};

const Label: React.FC<Props> = ({ text, style }) => {
  const { color, borderColor, backgroundColor, borderWidth = 1 } = style;
  return (
    <Text
      role="banner"
      fontSize="11px"
      width="auto"
      paddingX={3}
      paddingY={2}
      borderWidth={borderWidth}
      borderRadius={3}
      borderStyle={"solid"}
      flexGrow={0}
      flexShrink={0}
      overflow={"hidden"}
      textTransform="capitalize"
      color={color}
      borderColor={borderColor}
      backgroundColor={backgroundColor}
      fontWeight="semiBold"
    >
      {text}
    </Text>
  );
};

export default Label;
