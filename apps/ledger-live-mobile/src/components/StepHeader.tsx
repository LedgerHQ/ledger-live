import React from "react";
import { TouchableWithoutFeedback } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { scrollToTop } from "~/navigation/utils";

type Props = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  testID?: string;
  adjustFontSize?: boolean;
};

export default function StepHeader({ title, subtitle, testID, adjustFontSize }: Props) {
  return (
    <TouchableWithoutFeedback onPress={scrollToTop}>
      <Flex flexDirection="column" justifyContent="center" py={3}>
        {subtitle && (
          <Text
            variant={"small"}
            fontWeight={"medium"}
            numberOfLines={1}
            textAlign={"center"}
            color={"neutral.c80"}
          >
            {subtitle}
          </Text>
        )}
        <Text
          variant={"h5"}
          fontWeight={"semiBold"}
          numberOfLines={1}
          textAlign={"center"}
          color={"neutral.c100"}
          testID={testID}
          adjustsFontSizeToFit={adjustFontSize}
        >
          {title}
        </Text>
      </Flex>
    </TouchableWithoutFeedback>
  );
}
