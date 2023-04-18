import React from "react";
import { TouchableWithoutFeedback } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { scrollToTop } from "../navigation/utils";

type Props = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  testID?: string;
};

export default function StepHeader({ title, subtitle, testID }: Props) {
  return (
    <TouchableWithoutFeedback onPress={scrollToTop}>
      <Flex
        flexDirection={"column"}
        justifyContent={"center"}
        flex={1}
        py={3}
        testID={testID}
      >
        {subtitle && (
          <Text
            variant={"paragraph"}
            fontWeight={"semiBold"}
            numberOfLines={1}
            textAlign={"center"}
            color={"neutral.c80"}
          >
            {subtitle}
          </Text>
        )}
        <Text
          variant={"body"}
          fontWeight={"semiBold"}
          numberOfLines={1}
          textAlign={"center"}
          color={"neutral.c100"}
        >
          {title}
        </Text>
      </Flex>
    </TouchableWithoutFeedback>
  );
}
