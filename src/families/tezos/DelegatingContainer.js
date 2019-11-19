/* @flow */

import React from "react";
import { StyleSheet, Image, View } from "react-native";

type Props = {
  left: React$Node,
  right: React$Node,
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  delegationImage: {
    width: 96,
    height: 49,
    margin: 10,
  },
});

const DelegatingContainer = ({ left, right }: Props) => (
  <View style={styles.header}>
    {left}
    <Image
      style={styles.delegationImage}
      source={require("./delegation.png")}
    />
    {right}
  </View>
);

export default DelegatingContainer;
