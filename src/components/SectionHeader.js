/* @flow */
import React, { Component } from "react";
import { StyleSheet } from "react-native";
import colors from "../colors";
import LText from "./LText";
import FormatDay from "./FormatDay";

type Props = {
  section: {
    day: Date,
  },
};

export default class SectionHeader extends Component<Props> {
  render() {
    const { section } = this.props;
    return (
      <LText numberOfLines={1} semiBold style={styles.sectionHeader}>
        <FormatDay day={section.day} />
      </LText>
    );
  }
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 14,
    color: "#999",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.lightGrey,
  },
});
