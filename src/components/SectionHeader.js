/* @flow */
import React from "react";
import { StyleSheet } from "react-native";
import LText from "./LText";
import FormatDay from "./FormatDay";

type Props = {
  section: {
    day: Date,
  },
};

export default function SectionHeader({ section }: Props) {
  return (
    <LText numberOfLines={1} semiBold color="grey" style={styles.sectionHeader}>
      <FormatDay day={section.day} />
    </LText>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
});
