/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import { RNCamera } from "react-native-camera";
import { connect } from "react-redux";
import Config from "react-native-config";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";
import i18next from "i18next";
import { decodeURIScheme } from "@ledgerhq/live-common/lib/currencies";
import type {
  Account,
  AccountLike,
  Transaction,
} from "@ledgerhq/live-common/lib/types";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import HeaderRightClose from "../../components/HeaderRightClose";
import StyledStatusBar from "../../components/StyledStatusBar";
import CameraScreen from "../../components/CameraScreen";
import colors from "../../colors";
import FallBackCamera from "./FallbackCamera/Fallback";
import getWindowDimensions from "../../logic/getWindowDimensions";

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: Transaction,
    },
  }>,
  account: AccountLike,
  parentAccount: ?Account,
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
    const { account, parentAccount, navigation } = this.props;
    if (!account) return;
    const bridge = getAccountBridge(account, parentAccount);
    const { amount, address, currency, ...rest } = decodeURIScheme(result);
    const transaction = navigation.getParam("transaction");
    const patch: Object = {};
    patch.recipient = address;
    if (amount) {
      patch.amount = amount;
    }
    for (const k in rest) {
      if (k in transaction) {
        patch[k] = rest[k];
      }
    }

    this.props.navigation.navigate("SendSelectRecipient", {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction: bridge.updateTransaction(transaction, patch),
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

const mapStateToProps = accountAndParentScreenSelector;

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
