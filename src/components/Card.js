// @flow

import React, { Component } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  onPress?: () => void,
  children: any,
  style?: any,
};

export default class Card extends Component<Props> {
  render() {
    const { onPress, style, children } = this.props;
    const Container = onPress ? TouchableOpacity : View;
    return (
      <Container onPress={onPress} style={[styles.root, style]}>
        {children}
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "white",
    borderRadius: 4,
  },
});
