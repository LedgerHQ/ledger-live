import React, { Component } from "react";
import { View, StyleSheet, Text } from "react-native";

export default class SectionTitle extends Component<{
  title: string
}> {
  render() {
    const { title } = this.props;
    return (
      <View style={styles.sectionTitle}>
        <Text style={styles.sectionTitleText}>{title}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  sectionTitle: {
    padding: 15
  },
  sectionTitleText: {
    fontSize: 14
  }
});
