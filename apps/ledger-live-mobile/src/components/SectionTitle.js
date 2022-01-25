import React, { Component } from "react";
import { View, StyleSheet, Text } from "react-native";

export default class SectionTitle extends Component<{
  title?: string,
  children?: *,
}> {
  render() {
    const { title, children } = this.props;
    return (
      <View style={styles.sectionTitle}>
        {title ? <Text style={styles.sectionTitleText}>{title}</Text> : null}
        {children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  sectionTitle: {
    padding: 15,
  },
  sectionTitleText: {
    fontSize: 14,
  },
});
