// @flow

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import { useTheme } from "@react-navigation/native";
import TranslatedError from "./TranslatedError";
import LText from "./LText";

type Props = {
  error: Error,
  withDescription?: boolean,
};

function HeaderErrorTitle({ error, withDescription }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <View style={styles.titleContainer}>
        <LText style={styles.icon}>
          <Icon name="x-circle" size={16} color={colors.alert} />
        </LText>
        <LText
          numberOfLines={2}
          secondary
          style={styles.title}
          semiBold
          color="alert"
        >
          <TranslatedError error={error} />
        </LText>
      </View>
      {withDescription ? (
        <LText
          secondary
          style={styles.description}
          color="alert"
          numberOfLines={2}
        >
          <TranslatedError error={error} field="description" />
        </LText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
    paddingRight: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    justifyContent: "center",
  },
  description: {
    marginTop: 5,
    fontSize: 14,
  },
  icon: {
    marginRight: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default memo<Props>(HeaderErrorTitle);
