/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { RNCamera } from "react-native-camera";
import Config from "react-native-config";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";
import i18next from "i18next";
import { decodeURIScheme } from "@ledgerhq/live-common/lib/currencies";
import type { T } from "../../types/common";

import HeaderRightClose from "../../components/HeaderRightClose";
import StyledStatusBar from "../../components/StyledStatusBar";
import CameraScreen from "../../components/CameraScreen";
import colors from "../../colors";
import FallBackCamera from "../ImportAccounts/FallBackCamera";

type Props = {
  navigation: NavigationScreenProp<{
    accountId: string,
  }>,
  t: T,
};

type State = {
  width: number,
  height: number,
};

const getDimensions = () => {
  const { width, height } = Dimensions.get("window");

  return { width, height };
};

class ScanRecipient extends PureComponent<Props, State> {
  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationScreenProp<*>,
  }) => ({
    title: i18next.t("account.import.scan.title"),
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
    ...getDimensions(),
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
    const accountId = this.props.navigation.getParam("accountId");
    const { amount, address, currency, ...rest } = decodeURIScheme(result);
    const params: { [_: string]: * } = {
      accountId,
      address,
      ...rest,
    };
    if (amount) {
      params.amount = amount.toString();
    }
    // $FlowFixMe
    this.props.navigation.replace("SendSelectRecipient", params);
  };

  setDimensions = () => {
    const dimensions = getDimensions();

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
          style={[styles.camera, cameraDimensions]}
          notAuthorizedView={<FallBackCamera navigation={navigation} />}
        >
          <CameraScreen width={width} height={height} />
        </RNCamera>
      </View>
    );
  }
}

export default translate()(ScanRecipient);

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
