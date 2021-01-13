// @flow
import React from "react";
import { TouchableWithoutFeedback, View, StyleSheet } from "react-native";
import LText from "./LText";
import { scrollToTop } from "../navigation/utils";

type Props = {
  title: React$Node,
  subtitle?: React$Node,
};

export default function StepHeader({ title, subtitle }: Props) {
  return (
    <TouchableWithoutFeedback onPress={scrollToTop}>
      <View style={styles.root}>
        <LText style={styles.subtitle} color="grey">
          {subtitle}
        </LText>
        <LText semiBold secondary numberOfLines={1} style={styles.title}>
          {title}
        </LText>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    flex: 1,
    paddingVertical: 5,
  },
  title: {
    textAlign: "center",
    flexGrow: 1,
    fontSize: 16,
  },
  subtitle: {
    textAlign: "center",
  },
});
