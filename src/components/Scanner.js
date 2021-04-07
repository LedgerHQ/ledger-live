/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import { RNCamera } from "react-native-camera";
import StyledStatusBar from "./StyledStatusBar";
import CameraScreen from "./CameraScreen";
import FallBackCamera from "./FallbackCamera/Fallback";
import getWindowDimensions from "../logic/getWindowDimensions";

type Props = {
  screenName?: string,
  navigation: any,
  onResult: Function,
};

type State = {
  width: number,
  height: number,
};

class Scanner extends PureComponent<Props, State> {
  state = {
    ...getWindowDimensions(),
  };

  lastData: ?string = null;

  frames: * = null;

  completed: boolean = false;

  onBarCodeRead = ({ data }: { data: string }) => {
    if (data) {
      this.props.onResult(data);
    }
  };

  setDimensions = () => {
    const dimensions = getWindowDimensions();

    this.setState(dimensions);
  };

  render() {
    const { width, height } = this.state;
    const { navigation, screenName } = this.props;
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
          notAuthorizedView={
            <FallBackCamera navigation={navigation} screenName={screenName} />
          }
        >
          {({ status }) =>
            status === "READY" ? (
              <CameraScreen width={width} height={height} />
            ) : null
          }
        </RNCamera>
      </View>
    );
  }
}

export default Scanner;

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
