/* @flow */
import React, { Component } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import QRCode from "react-native-qrcode-svg";
import colors from "../colors";

export default class QRCodePreview extends Component<{
  address: string,
  size: number
}> {
  static defaultProps = {
    size: 160
  };
  render() {
    const { address, size } = this.props;
    return (
      <View style={styles.root}>
        <QRCode
          size={size}
          value={address}
          logo={require("../images/qrledger.jpg")}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "white",
    padding: 10
  }
});
