/* @flow */
import React from "react";
import { View, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { useTheme } from "@react-navigation/native";

type Props = {
  Header: React$ComponentType<$Shape<T>>,
  children: *,
  onPressHeader?: () => void,
  extraData?: T,
};

function ScreenGeneric({ children, Header, onPressHeader, extraData }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={onPressHeader}>
        <View style={[styles.header, { backgroundColor: colors.live }]}>
          <Header {...extraData} />
        </View>
      </TouchableWithoutFeedback>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 70,
    paddingTop: 20,
  },
  body: {
    flex: 1,
    position: "relative",
  },
});

export default ScreenGeneric;
