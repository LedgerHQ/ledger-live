/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { RNCamera } from "react-native-camera";
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
import colors from "../../colors";
import FallBackCamera from "./FallBackCamera";
import CameraScreen from "../../components/CameraScreen";

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
          <CameraScreen width={width} height={height} progress={progress} />
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
});
