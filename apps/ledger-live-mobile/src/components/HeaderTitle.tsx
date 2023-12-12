import React from "react";
import { TouchableWithoutFeedback } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { HeaderTitleProps } from "@react-navigation/elements";
import { BaseTextProps } from "@ledgerhq/native-ui/components/Text/index";
import { scrollToTop } from "~/navigation/utils";
import { Merge } from "~/types/helpers";

export type Props = Merge<
  HeaderTitleProps,
  { children?: React.ReactNode; color?: BaseTextProps["color"] }
>;

export default function HeaderTitle(props: Props) {
  return (
    <TouchableWithoutFeedback onPress={scrollToTop}>
      <Text {...(props as BaseTextProps)} variant={"h5"} mx={5} mt={1} testID="live-app-title" />
    </TouchableWithoutFeedback>
  );
}
