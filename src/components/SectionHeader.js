/* @flow */
import React, { Component } from "react";
import moment from "moment";
import { StyleSheet } from "react-native";
import colors from "../colors";
import LText from "./LText";

const calendarOpts = {
  sameDay: "LL – [Today]",
  nextDay: "LL – [Tomorrow]",
  lastDay: "LL – [Yesterday]",
  lastWeek: "LL",
  sameElse: "LL",
};

type Props = {
  section: {
    day: Date,
  },
};

export default class SectionHeader extends Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    return nextProps.section.day.getTime() !== this.props.section.day.getTime();
  }

  render() {
    const { section } = this.props;
    return (
      <LText numberOfLines={1} semiBold style={styles.sectionHeader}>
        {moment(section.day).calendar(null, calendarOpts)}
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
