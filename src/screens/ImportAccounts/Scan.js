/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
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

import colors from "../../colors";
import { TrackScreen } from "../../analytics";
import HeaderRightClose from "../../components/HeaderRightClose";
import StyledStatusBar from "../../components/StyledStatusBar";
import FallBackCamera from "./FallBackCamera";
import CameraScreen from "../../components/CameraScreen";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import getWindowDimensions from "../../logic/getWindowDimensions";

type Props = {
  navigation: NavigationScreenProp<*>,
};

class Scan extends PureComponent<
  Props,
  {
    progress: number,
    error: ?Error,
    width: number,
    height: number,
  },
> {
  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationScreenProp<*>,
  }) => ({
    title: i18next.t("account.import.scan.title"),
    headerRight: (
      <HeaderRightClose navigation={navigation} color={colors.white} />
    ),
    headerLeft: null,
  });

  state = {
    progress: 0,
    error: null,
    ...getWindowDimensions(),
  };

  componentDidMount() {
    const { navigation } = this.props;
    const data = navigation.getParam("data");
    if (data) {
      const frames = data.reduce(parseFramesReducer, null);
      if (areFramesComplete(frames)) {
        this.onResult(decode(framesToData(frames).toString()));
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
          try {
            this.onResult(decode(framesToData(this.frames).toString()));
            this.completed = true;
          } catch (error) {
            this.frames = null;
            this.setState({ error, progress: 0 });
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }
  };

  onCloseError = () => {
    this.setState({ error: null });
  };

  onResult = result => {
    // $FlowFixMe
    this.props.navigation.replace("DisplayResult", {
      result,
      onFinish: this.props.navigation.getParam("onFinish"),
    });
  };

  setDimensions = () => {
    const dimensions = getWindowDimensions();

    this.setState(dimensions);
  };

  render() {
    const { progress, width, height, error } = this.state;
    const { navigation } = this.props;
    const cameraRatio = 16 / 9;
    const cameraDimensions =
      width > height
        ? { width, height: width / cameraRatio }
        : { width: height / cameraRatio, height };

    return (
      <View style={styles.root} onLayout={this.setDimensions}>
        <TrackScreen category="ImportAccounts" name="Scan" />
        <StyledStatusBar barStyle="light-content" />
        <RNCamera
          barCodeTypes={[RNCamera.Constants.BarCodeType.qr]} // Do not look for barCodes other than QR
          onBarCodeRead={this.onBarCodeRead}
          ratio="16:9"
          captureAudio={false}
          style={[styles.camera, cameraDimensions]}
          notAuthorizedView={<FallBackCamera navigation={navigation} />}
        >
          <CameraScreen liveQrCode width={width} height={height} progress={progress} />
        </RNCamera>
        <GenericErrorBottomModal error={error} onClose={this.onCloseError} />
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
