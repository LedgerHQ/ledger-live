/* @flow */
import React, { Component } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal
} from "react-native";
import Camera from "react-native-camera";
import { decodeURIScheme } from "@ledgerhq/currencies";
import colors from "../colors";
import Menu from "../components/Menu";
import MenuTitle from "../components/MenuTitle";
import BlueButton from "../components/BlueButton";
import GreyButton from "../components/GreyButton";
import HeaderRightText from "../components/HeaderRightText";

export default class SendFundsScanAddress extends Component<*, *> {
  static navigationOptions = {
    title: "Scan the QR Code",
    headerRight: <HeaderRightText>2 of 5</HeaderRightText>
  };
  state = {
    decodedResult: null,
    focused: false
  };
  willFocusSub: *;
  didBlurSub: *;
  componentDidMount() {
    const { navigation } = this.props;
    this.willFocusSub = navigation.addListener("willFocus", this.willFocus);
    this.didBlurSub = navigation.addListener("didBlur", this.didBlur);
  }
  componentWillUnmount() {
    this.didBlurSub.remove();
    this.willFocusSub.remove();
  }
  willFocus = () => {
    this.setState({ focused: true });
  };
  didBlur = () => {
    this.setState({ focused: false });
  };
  onRequestClose = () => {
    this.setState({ address: null });
  };
  onConfirm = () => {
    const { navigation } = this.props;
    const { decodedResult } = this.state;
    if (!decodedResult) return;
    const { address, amount } = decodedResult;
    this.setState({ decodedResult: null });
    if (amount) {
      navigation.navigate("SendFundsChoseFee", {
        ...navigation.state.params,
        address,
        amount
      });
    } else {
      navigation.navigate("SendFundsChoseAmount", {
        ...navigation.state.params,
        address
      });
    }
  };

  barCodeRead = (data: *) => {
    const decodedResult = decodeURIScheme(data.data);
    this.setState({ decodedResult });
  };

  render() {
    const { decodedResult, focused } = this.state;
    return (
      <View style={styles.root}>
        {focused ? (
          <Camera
            style={styles.camera}
            aspect={Camera.constants.Aspect.fill}
            onBarCodeRead={this.barCodeRead}
          />
        ) : (
          <View style={styles.camera} />
        )}
        <View style={{ padding: 40 }}>
          <BlueButton
            title="fakely picking an address"
            onPress={() =>
              this.setState({
                decodedResult: { address: "1gre1noAY9HiK2qxoW8FzSdjdFBcoZ5fV" }
              })
            }
          />
        </View>

        {decodedResult ? (
          <Modal transparent onRequestClose={this.onRequestClose}>
            <Menu
              onRequestClose={this.onRequestClose}
              header={<MenuTitle>Bitcoin address</MenuTitle>}
            >
              <Text style={styles.address}>{decodedResult.address}</Text>
              <View style={styles.footer}>
                <GreyButton
                  title="Scan QR Code"
                  onPress={this.onRequestClose}
                />
                <View style={{ width: 4 }} />
                <BlueButton title="Confirm address" onPress={this.onConfirm} />
              </View>
            </Menu>
          </Modal>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  address: {
    backgroundColor: "#eee",
    padding: 6
  },
  footer: {
    padding: 10,
    flexDirection: "row"
  },
  camera: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "flex-end",
    alignItems: "center",
    alignSelf: "stretch"
  }
});
