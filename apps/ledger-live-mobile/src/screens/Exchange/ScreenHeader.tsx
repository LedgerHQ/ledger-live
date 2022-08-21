import React from "react";
import { StyleSheet, View } from "react-native";
import AppIcon from "../Platform/AppIcon";
import LText from "../../components/LText";

type Props = {
  icon: string;
  name: string;
};
export default function ScreenHeader({ icon, name }: Props) {
  return (
    <View style={styles.root}>
      <AppIcon icon={icon} name={name} size={24} />
      <LText style={styles.label}>{name}</LText>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    marginLeft: 8,
    fontSize: 16,
  },
});
