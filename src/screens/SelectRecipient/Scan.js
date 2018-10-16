/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { RNCamera } from "react-native-camera";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";
import i18next from "i18next";
import type { T } from "../../types/common";
import HeaderRightClose from "../../components/HeaderRightClose";
import StyledStatusBar from "../../components/StyledStatusBar";
import LText from "../../components/LText";
import colors, { rgba } from "../../colors";
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

class Scan extends PureComponent<Props, State> {
  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationScreenProp<{
      accountId: string,
    }>,
  }) => ({
    title: i18next.t("account.import.scan.title"),
    headerRight: (
      <HeaderRightClose
        // $FlowFixMe
        navigation={navigation.dangerouslyGetParent()}
        color={colors.white}
      />
    ),
    headerLeft: null,
  });

  state = {
    progress: 0,
    ...getDimensions(),
  };

  lastData: ?string = null;

  frames: * = null;

  completed: boolean = false;

  onBarCodeRead = ({ data }: { data: string }) => {
    if (data) {
      this.onResult(data);
    }
  };

  onResult = result => {
    const accountId = this.props.navigation.getParam("accountId");
    // $FlowFixMe
    this.props.navigation.replace("SendSelectRecipient", { result, accountId });
  };

  setDimensions = () => {
    const dimensions = getDimensions();

    this.setState(dimensions);
  };

  render() {
    const { width, height } = this.state;
    const { t, navigation } = this.props;
    const cameraRatio = 16 / 9;
    const cameraDimensions =
      width > height
        ? { width, height: width / cameraRatio }
        : { width: height / cameraRatio, height };

    // Make the viewfinder borders 2/3 of the screen shortest border
    const viewFinderSize = (width > height ? height : width) * (2 / 3);
    const wrapperStyle =
      width > height
        ? { height, alignSelf: "stretch" }
        : { width, flexGrow: 1 };

    // TODO refactor to components!
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
          <View style={wrapperStyle}>
            <View style={styles.row}>
              <View style={styles.darken} />
              <View style={{ width: viewFinderSize, height: viewFinderSize }}>
                <View style={styles.innerRow}>
                  <View
                    style={[styles.border, styles.borderLeft, styles.borderTop]}
                  />
                  <View style={styles.border} />
                  <View
                    style={[
                      styles.border,
                      styles.borderRight,
                      styles.borderTop,
                    ]}
                  />
                </View>
                <View style={styles.innerRow} />
                <View style={styles.innerRow}>
                  <View
                    style={[
                      styles.border,
                      styles.borderLeft,
                      styles.borderBottom,
                    ]}
                  />
                  <View style={styles.border} />
                  <View
                    style={[
                      styles.border,
                      styles.borderRight,
                      styles.borderBottom,
                    ]}
                  />
                </View>
              </View>
              <View style={styles.darken} />
            </View>
            <View style={[styles.darken, styles.centered]}>
              <View style={styles.centered}>
                <LText semibold style={styles.text}>
                  {t("account.import.scan.descBottom")}
                </LText>
              </View>
            </View>
          </View>
        </RNCamera>
      </View>
    );
  }
}

export default translate()(Scan);

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
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  innerRow: {
    flexDirection: "row",
    alignItems: "stretch",
    flexGrow: 1,
  },
  topCell: {
    paddingTop: 64,
  },
  darken: {
    backgroundColor: rgba(colors.darkBlue, 0.4),
    flexGrow: 1,
  },
  text: {
    fontSize: 16,
    lineHeight: 32,
    textAlign: "center",
    color: colors.white,
  },
  border: {
    borderColor: "white",
    flexGrow: 1,
  },
  borderTop: {
    borderTopWidth: 6,
  },
  borderBottom: {
    borderBottomWidth: 6,
  },
  borderLeft: {
    borderLeftWidth: 6,
  },
  borderRight: {
    borderRightWidth: 6,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
