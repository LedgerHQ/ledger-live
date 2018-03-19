import React, { Component } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";

export default class SectionEntry extends Component<{
  onPress: () => void,
  center: *,
  children: *
}> {
  render() {
    const { onPress, children, center } = this.props;
    return (
      <TouchableOpacity onPress={onPress}>
        <View
          style={[styles.sectionEntry, center && styles.sectionEntryCenter]}
        >
          {children}
        </View>
      </TouchableOpacity>
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
