// @flow
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import LText from "./LText";

type Props = {
  name: string,
  icon?: React$Node,
  onPress?: () => void,
  RightComponent?: React$Node,
};

export default function AccountSectionLabel({
  name,
  icon,
  onPress,
  RightComponent,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.label}>
        <LText semiBold style={styles.labelText}>
          {name}
        </LText>
        {icon}
      </View>
      {!!RightComponent && (
        <View style={styles.rightWrapper}>{RightComponent}</View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  labelText: {
    fontSize: 18,
    marginRight: 6,
  },
  rightWrapper: {
    alignSelf: "flex-end",
  },
});
