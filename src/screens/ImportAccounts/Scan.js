/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import { RNCamera } from "react-native-camera";
import {
  parseFramesReducer,
  framesToData,
  areFramesComplete,
  progressOfFrames,
} from "qrloop";
import { decode } from "@ledgerhq/live-common/lib/cross";

import { TrackScreen } from "../../analytics";
import StyledStatusBar from "../../components/StyledStatusBar";
import { ScreenName } from "../../const";
import FallBackCamera from "./FallBackCamera";
import CameraScreen from "../../components/CameraScreen";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import getWindowDimensions from "../../logic/getWindowDimensions";
import { withTheme } from "../../colors";

type Props = {
  navigation: any,
  route: any,
  colors: *,
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
  state = {
    progress: 0,
    error: null,
    ...getWindowDimensions(),
  };

  componentDidMount() {
    const data = this.props.route.params?.data;
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
    const onFinish = this.props.route.params?.onFinish;

    this.props.navigation.replace(ScreenName.DisplayResult, {
      result,
      onFinish,
    });
  };

  setDimensions = () => {
    const dimensions = getWindowDimensions();

    this.setState(dimensions);
  };

  render() {
    const { progress, width, height, error } = this.state;
    const { navigation, colors } = this.props;
    const cameraRatio = 16 / 9;
    const cameraDimensions =
      width > height
        ? { width, height: width / cameraRatio }
        : { width: height / cameraRatio, height };

    return (
      <View
        style={[styles.root, { backgroundColor: colors.darkBlue }]}
        onLayout={this.setDimensions}
      >
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
          {({ status }) =>
            status === "READY" ? (
              <CameraScreen
                liveQrCode
                width={width}
                height={height}
                progress={progress}
              />
            ) : null
          }
        </RNCamera>
        <GenericErrorBottomModal error={error} onClose={this.onCloseError} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default withTheme(Scan);
