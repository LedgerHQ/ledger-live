/* @flow */

import React, { Component } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback
} from "react-native";
import { BlurView } from "react-native-blur";
import QRCodePreview from "../components/QRCodePreview";

class MenuItem extends Component<{ title: string, onPress: * }> {
  render() {
    const { title, onPress } = this.props;
    return (
      <TouchableOpacity onPress={onPress}>
        <View style={styles.menuItem}>
          <View
            style={[
              styles.menuItemIcon,
              {
                backgroundColor: "black" /* TODO icon */
              }
            ]}
          />
          <Text style={styles.menuItemText}>{title}</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

class QRCodeAddress extends Component<{
  viewRef: *,
  address: string,
  onRequestClose: () => void
}> {
  onVerify = () => {};
  onCopy = () => {};
  onShare = () => {};
  render() {
    const { viewRef, address, onRequestClose } = this.props;
    return (
      <Modal transparent onRequestClose={onRequestClose}>
        <BlurView viewRef={viewRef} blurType="light" style={styles.blurView} />
        <TouchableWithoutFeedback onPress={onRequestClose}>
          <View style={styles.root}>
            <QRCodePreview address={address} />
            <View style={styles.menu}>
              <MenuItem title="Verify on device" onPress={this.onVerify} />
              <View style={styles.menuItemSeparator} />
              <MenuItem title="Copy" onPress={this.onCopy} />
              <View style={styles.menuItemSeparator} />
              <MenuItem title="Share" onPress={this.onShare} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  blurView: {
    flex: 1
  },
  root: {
    position: "absolute",
    width: "100%",
    height: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10
  },
  menu: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignSelf: "stretch",
    borderRadius: 10
  },
  menuItemIcon: {
    width: 20,
    height: 20
  },
  menuItem: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center"
  },
  menuItemSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: "rgb(100,160,250)"
  },
  menuItemText: {
    marginLeft: 20,
    fontSize: 18
  }
});

export default QRCodeAddress;
