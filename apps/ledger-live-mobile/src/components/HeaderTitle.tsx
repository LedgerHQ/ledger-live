import React from "react";
import { TouchableWithoutFeedback } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { HeaderTitleProps } from "@react-navigation/elements";
import { BaseTextProps } from "@ledgerhq/native-ui/components/Text";
import { scrollToTop } from "../navigation/utils";
import { Merge } from "../types/helpers";

export default function HeaderTitle(
  props: Merge<HeaderTitleProps, { children?: React.ReactNode }>,
) {
  return (
    <TouchableWithoutFeedback onPress={scrollToTop}>
      <Text {...(props as BaseTextProps)} variant={"h5"} mx={5} mt={1} />
    </TouchableWithoutFeedback>
  );
}
