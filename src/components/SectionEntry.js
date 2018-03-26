import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import Touchable from "./Touchable";

export default class SectionEntry extends Component<{
  onPress: () => void,
  center: *,
  children: *
}> {
  render() {
    const { onPress, children, center } = this.props;
    return (
      <Touchable onPress={onPress}>
        <View
          style={[styles.sectionEntry, center && styles.sectionEntryCenter]}
        >
          {children}
        </View>
      </Touchable>
    );
  }
}

const styles = StyleSheet.create({
  sectionEntry: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "white",
    marginBottom: 1
  },
  sectionEntryCenter: {
    justifyContent: "center"
  }
});
