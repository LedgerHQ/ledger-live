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
    address: null
  };
  onRequestClose = () => {
    this.setState({ address: null });
  };
  onConfirm = () => {
    const { navigation } = this.props;
    const { address } = this.state;
    this.setState({ address: null });
    navigation.navigate("SendFundsChoseAmount", {
      ...navigation.state.params,
      address
    });
  };

  barCodeRead = data => {
    const address = data.data;

    this.setState({ address });
  };

  render() {
    const { address } = this.state;
    return (
      <View style={styles.root}>
        <Camera
          style={styles.camera}
          aspect={Camera.constants.Aspect.fill}
          onBarCodeRead={this.barCodeRead}
        />
        <View style={{ padding: 40 }}>
          <BlueButton
            title="fakely picking an address"
            onPress={() =>
              this.setState({ address: "1gre1noAY9HiK2qxoW8FzSdjdFBcoZ5fV" })
            }
          />
        </View>

        {address ? (
          <Modal transparent onRequestClose={this.onRequestClose}>
            <Menu
              onRequestClose={this.onRequestClose}
              header={<MenuTitle>Bitcoin address</MenuTitle>}
            >
              <Text style={styles.address}>{address}</Text>
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
    justifyContent: "flex-end",
    alignItems: "center",
    alignSelf: "stretch"
  }
});
