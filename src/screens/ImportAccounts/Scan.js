/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { RNCamera } from "react-native-camera";
import ProgressCircle from "react-native-progress/Circle";
import type { NavigationScreenProp } from "react-navigation";
import {
  parseFramesReducer,
  framesToData,
  areFramesComplete,
  progressOfFrames,
} from "qrloop/importer";
import { decode } from "@ledgerhq/live-common/lib/cross";
import { translate } from "react-i18next";
import i18next from "i18next";
import type { T } from "../../types/common";
import HeaderRightClose from "../../components/HeaderRightClose";
import StyledStatusBar from "../../components/StyledStatusBar";
import LText, { getFontStyle } from "../../components/LText";
import colors, { rgba } from "../../colors";
import FallBackCamera from "./FallBackCamera";

type Props = {
  navigation: NavigationScreenProp<*>,
  t: T,
};

const getDimensions = () => {
  const { width, height } = Dimensions.get("window");

  return { width, height };
};

class Scan extends PureComponent<
  Props,
  {
    progress: number,
    width: number,
    height: number,
  },
> {
  static navigationOptions = ({
    navigation,
  }: {
    // $FlowFixMe
    navigation: NavigationScreenProp<*>,
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

  componentDidMount() {
    const { navigation } = this.props;
    const data = navigation.getParam("data");
    if (data) {
      const frames = data.reduce(parseFramesReducer, []);
      if (areFramesComplete(frames)) {
        this.onResult(decode(framesToData(frames)));
      }
    }
  }

  lastData: ?string = null;

  frames: * = null;

  completed: boolean = false;

  onBarCodeRead = ({ data }: { data: string }) => {
    if (data && data !== this.lastData && !this.completed) {
      this.lastData = data;
      try {
        this.frames = parseFramesReducer(this.frames, data);

        this.setState({ progress: progressOfFrames(this.frames) });

        if (areFramesComplete(this.frames)) {
          this.completed = true;
          // TODO read the frames version and check it's correctly supported (if newers version, we deny the import with an error)
          this.onResult(decode(framesToData(this.frames)));
        }
      } catch (e) {
        console.warn(e);
      }
    }
  };

  onResult = result => {
    // $FlowFixMe
    this.props.navigation.replace("DisplayResult", { result });
  };

  setDimensions = () => {
    const dimensions = getDimensions();

    this.setState(dimensions);
  };

  render() {
    const { progress, width, height } = this.state;
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
            <View style={[styles.darken, styles.centered, styles.topCell]}>
              <LText semibold style={styles.text}>
                {t("account.import.scan.descTop.line1")}
              </LText>
              <LText bold style={styles.text}>
                {t("account.import.scan.descTop.line2")}
              </LText>
            </View>

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
              <View style={styles.centered}>
                <ProgressCircle
                  showsText={!!progress}
                  progress={progress}
                  color={colors.white}
                  borderWidth={0}
                  thickness={progress ? 4 : 0}
                  size={viewFinderSize / 4}
                  strokeCap="round"
                  textStyle={[
                    styles.progressText,
                    getFontStyle({ tertiary: true, semiBold: true }),
                  ]}
                />
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
  column: {
    flexDirection: "column",
    alignItems: "stretch",
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
  progressText: {
    color: colors.white,
    fontSize: 16,
  },
});
