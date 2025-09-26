import React from "react";
import { View, Text, ViewStyle } from "react-native";
import useStyles from "./style";

type Props = { label: string; style?: ViewStyle };

export default function SectionHeader({ label, style }: Props) {
  const styles = useStyles();
  return (
    <View style={[styles.sectionBar, style]}>
      <Text style={styles.sectionHeader}>{label}</Text>
      <View style={styles.divider} />
    </View>
  );
}
