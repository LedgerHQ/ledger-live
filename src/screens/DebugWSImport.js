// @flow

import React, { Component } from "react";
import { StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useNavigation } from "@react-navigation/native";
import { decode } from "@ledgerhq/live-common/lib/cross";
import { RNCamera } from "react-native-camera";
import { ScreenName } from "../const";
import colors from "../colors";
import CameraScreen from "../components/CameraScreen";

const forceInset = { bottom: "always" };

class DebugWSImport extends Component<
  { navigation: any },
  { ip: string, secret: string, scanning: boolean },
> {
  state = {
    secret: "",
    ip: "",
    scanning: true,
  };

  onBarCodeRead = ({ data }: { data: string }) => {
    const share = data.split("~");
    if (share.length === 2) {
      this.setState({ secret: share[0], ip: share[1], scanning: false }, () => {
        const { ip, secret } = this.state;

        const ws = new WebSocket(`ws://${ip}:1234`);
        ws.onopen = () => {
          ws.send(secret);
        };

        ws.onmessage = event => {
          this.props.navigation.navigate(ScreenName.DisplayResult, {
            // $FlowFixMe
            result: decode(event.data),
          });
        };
      });
    }
  };

  render() {
    return (
      <SafeAreaView style={styles.root} forceInset={forceInset}>
        <RNCamera
          barCodeTypes={[RNCamera.Constants.BarCodeType.qr]} // Do not look for barCodes other than QR
          onBarCodeRead={this.onBarCodeRead}
          ratio="16:9"
          style={[styles.camera]}
        >
          {({ status }) =>
            status === "READY" ? (
              <CameraScreen width={200} height={200} />
            ) : null
          }
        </RNCamera>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  camera: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
});

export default function Screen() {
  const navigation = useNavigation();

  return <DebugWSImport navigation={navigation} />;
}
