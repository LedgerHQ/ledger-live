/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import { RNCamera } from "react-native-camera";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import Config from "react-native-config";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";
import i18next from "i18next";
import { decodeURIScheme } from "@ledgerhq/live-common/lib/currencies";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { accountScreenSelector } from "../../reducers/accounts";
import { getAccountBridge } from "../../bridge";
import HeaderRightClose from "../../components/HeaderRightClose";
import StyledStatusBar from "../../components/StyledStatusBar";
import CameraScreen from "../../components/CameraScreen";
import colors from "../../colors";
import FallBackCamera from "./FallbackCamera/Fallback";
import getWindowDimensions from "../../logic/getWindowDimensions";

type Props = {
  navigation: NavigationScreenProp<{
    accountId: string,
  }>,
  account: Account,
};

type State = {
  width: number,
  height: number,
};

class ScanRecipient extends PureComponent<Props, State> {
  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationScreenProp<*>,
  }) => ({
    title: i18next.t("send.scan.title"),
    headerRight: (
      <HeaderRightClose
        navigation={navigation}
        color={colors.white}
        preferDismiss={false}
      />
    ),
    headerLeft: null,
  });

  state = {
    ...getWindowDimensions(),
  };

  lastData: ?string = null;

  frames: * = null;

  completed: boolean = false;

  componentDidMount() {
    if (Config.MOCK_SCAN_RECIPIENT) {
      this.onResult(Config.MOCK_SCAN_RECIPIENT);
    }
  }

  onBarCodeRead = ({ data }: { data: string }) => {
    if (data) {
      this.onResult(data);
    }
  };

  onResult = (result: string) => {
    const { account } = this.props;
    const bridge = getAccountBridge(account);
    const { amount, address, currency, ...rest } = decodeURIScheme(result);
    let t = bridge.createTransaction(account);
    t = bridge.editTransactionRecipient(account, t, address);
    if (amount) {
      t = bridge.editTransactionAmount(account, t, amount);
    }
    t = Object.keys(rest).reduce(
      (t, k) => bridge.editTransactionExtra(account, t, k, rest[k]),
      t,
    );

    this.props.navigation.navigate("SendSelectRecipient", {
      accountId: account.id,
      transaction: t,
      justScanned: true,
    });
  };

  setDimensions = () => {
    const dimensions = getWindowDimensions();

    this.setState(dimensions);
  };

  render() {
    const { width, height } = this.state;
    const { navigation } = this.props;
    const cameraRatio = 16 / 9;
    const cameraDimensions =
      width > height
        ? { width, height: width / cameraRatio }
        : { width: height / cameraRatio, height };

    return (
      <View style={styles.root} onLayout={this.setDimensions}>
        <StyledStatusBar barStyle="light-content" />
        <RNCamera
          barCodeTypes={[RNCamera.Constants.BarCodeType.qr]} // Do not look for barCodes other than QR
          onBarCodeRead={this.onBarCodeRead}
          ratio="16:9"
          captureAudio={false}
          style={[styles.camera, cameraDimensions]}
          notAuthorizedView={<FallBackCamera navigation={navigation} />}
        >
          <CameraScreen width={width} height={height} />
        </RNCamera>
      </View>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

export default translate()(connect(mapStateToProps)(ScanRecipient));

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    alignItems: "center",
    justifyContent: "center",
  },
});
