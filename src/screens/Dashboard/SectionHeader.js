/* @flow */
import React from "react";
import moment from "moment";
import { StyleSheet } from "react-native";
import colors from "../../colors";
import LText from "../../components/LText";

const calendarOpts = {
  sameDay: "LL – [Today]",
  nextDay: "LL – [Tomorrow]",
  lastDay: "LL – [Yesterday]",
  lastWeek: "LL",
  sameElse: "LL"
};

export default ({
  section
}: {
  // $FlowFixMe
  section: { day: Date }
}) => (
  <LText numberOfLines={1} semiBold style={styles.sectionHeader}>
    {moment(section.day).calendar(null, calendarOpts)}
  </LText>
);

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 12,
    color: "#999",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.lightBackground
  }
});
