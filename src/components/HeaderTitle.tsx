import React from "react";
import { TouchableWithoutFeedback } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { scrollToTop } from "../navigation/utils";

export default function HeaderTitle(props: any) {
  return (
    <TouchableWithoutFeedback onPress={scrollToTop}>
      <Text {...props} variant={"h3"} mx={5} mt={1} />
    </TouchableWithoutFeedback>
  );
}
