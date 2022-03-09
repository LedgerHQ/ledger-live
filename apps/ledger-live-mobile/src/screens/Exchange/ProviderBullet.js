// @flow

import React from "react";
import { View, StyleSheet } from "react-native";
import LText from "../../components/LText";

type ProviderBulletProps = {
  text: string,
};

export default function ProviderBullet(props: ProviderBulletProps) {
  const { text } = props;

  return (
    <View style={styles.bullet}>
      <View style={styles.bulletIcon} />
      <LText style={styles.bulletText}>{text}</LText>
    </View>
  );
}

const styles = StyleSheet.create({
  bullet: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 6,
  },
  bulletIcon: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgb(100, 144, 241)",
  },
  bulletText: {
    fontSize: 14,
    marginLeft: 7,
  },
});
