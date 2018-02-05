/* @flow */
import React, { Component } from "react";
import {
  View,
  ScrollView,
  Text,
  Share,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  findNodeHandle
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import colors from "../colors";
import QRCodePreview from "../components/QRCodePreview";
import QRCodeModal from "../modals/QRCodeAddress";
import AppBtc from "@ledgerhq/hw-app-btc";
import type Transport from "@ledgerhq/hw-transport";
import findFirstTransport from "../hw/findFirstTransport";

export default class ReceiveFunds extends Component<*, *> {
  static navigationOptions = {
    title: "Receive Funds"
  };
  state = {
    qrCodeModalOpened: false,
    address: null,
    error: null,
    amount: null,
    account: 0
  };
  viewHandle: ?*;
  onRef = (ref: *) => {
    this.viewHandle = findNodeHandle(ref);
  };
  openQRCodeModal = () => {
    this.setState({ qrCodeModalOpened: true });
  };
  closeQRCodeModal = () => {
    this.setState({ qrCodeModalOpened: false });
  };

  sub: *;

  componentWillMount() {
    const { params } = this.props.navigation.state;
    const account = params.currency /* HACK */; // TODO we need to find a account that matches params.currency
    let amount = null;
    if (params.amount) {
      let amount = parseFloat(params.amount);
      if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
        amount = null;
      }
    }
    this.setState({ account, amount });
    this.sub = findFirstTransport().subscribe(
      this.onTransport,
      this.onTransportError
    );
  }

  componentWillUnmount() {
    this.stop();
  }

  stop = () => {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = null;
    }
  };

  onTransport = async (transport: *) => {
    try {
      transport.setDebugMode(true);
      const btc = new AppBtc(transport);
      const { bitcoinAddress } = await btc.getWalletPublicKey("44'/0'/0'/0");
      this.setState({ address: bitcoinAddress });
    } catch (error) {
      this.setState({ error });
    }
  };

  onTransportError = (error: *) => {
    this.setState({ error });
  };

  onShare = () => {
    const { address, amount, account } = this.state;
    if (!address) return;
    const currencySymbol = "BTC";
    const link = "bitcoin:" + address; // TODO needs formatter
    Share.share({
      title: "Send me " + (amount ? amount + " " : "") + currencySymbol,
      message: link
    });
  };

  render() {
    const { qrCodeModalOpened, address, error, amount, account } = this.state;
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        ref={this.onRef}
        bounces={false}
      >
        <Text style={{ color: "white", fontWeight: "bold", margin: 10 }}>
          Choose account
        </Text>

        <View
          style={{
            width: 300,
            height: 50,
            backgroundColor: "white",
            marginBottom: 10
          }}
        >
          <Text>{account}</Text>
        </View>

        <Text style={{ color: "white", fontWeight: "bold", margin: 10 }}>
          Request amount (optional)
        </Text>

        <View
          style={{
            width: 300,
            height: 50,
            marginBottom: 40,
            flexDirection: "row",
            justifyContent: "space-between"
          }}
        >
          <View
            style={{
              width: 120,
              height: 50,
              backgroundColor: "white"
            }}
          >
            <Text>{amount}</Text>
          </View>
          <View
            style={{
              width: 120,
              height: 50,
              backgroundColor: "white"
            }}
          />
        </View>

        {error ? (
          <Text style={{ color: "white" }}>{String(error)}</Text>
        ) : !address ? (
          <ActivityIndicator />
        ) : (
          <View style={styles.content}>
            <TouchableOpacity onPress={this.openQRCodeModal}>
              <QRCodePreview address={address} />
            </TouchableOpacity>

            <View />

            <Text style={{ color: "white", fontWeight: "bold", marginTop: 30 }}>
              Current address
            </Text>
            <View
              style={{
                // FIXME this should be a component
                padding: 10,
                margin: 10,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderWidth: 1,
                borderColor: "white",
                borderStyle: "dashed"
              }}
            >
              <Text style={{ color: "white" }}>{address}</Text>
            </View>

            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity onPress={this.onShare}>
                <View
                  style={{
                    width: 80,
                    height: 40,
                    margin: 10,
                    backgroundColor: "white",
                    borderRadius: 8
                  }}
                >
                  <Text>SHARE</Text>
                </View>
              </TouchableOpacity>
            </View>

            {qrCodeModalOpened ? (
              <QRCodeModal
                viewRef={this.viewHandle}
                address={address}
                onRequestClose={this.closeQRCodeModal}
              />
            ) : null}
          </View>
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.blue,
    flex: 1
  },
  content: {
    alignItems: "center",
    justifyContent: "center"
  }
});
