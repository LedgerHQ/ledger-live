/* @flow */
import React, { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Camera } from "expo-camera";
import { BarCodeScanner } from "expo-barcode-scanner";
import StyledStatusBar from "./StyledStatusBar";
import CameraScreen from "./CameraScreen";
import FallBackCamera from "../screens/ImportAccounts/FallBackCamera";
import getWindowDimensions from "../logic/getWindowDimensions";

type Props = {
  onResult: Function,
  liveQrCode?: boolean,
  progress?: number,
  instruction?: React$Node | string,
};

const Scanner = ({ onResult, liveQrCode, progress, instruction }: Props) => {
  const [hasPermission, setHasPermission] = useState(null);
  const { width, height } = getWindowDimensions();
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <FallBackCamera navigation={navigation} />;
  }

  return (
    <View style={styles.container}>
      <StyledStatusBar barStyle="light-content" />
      <Camera
        style={styles.camera}
        type={Camera.Constants.Type.back}
        ratio="16:9"
        onBarCodeScanned={({ data }) => onResult(data)}
        barCodeScannerSettings={{
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
        }}
      >
        <CameraScreen
          liveQrCode={liveQrCode}
          progress={progress}
          width={width}
          height={height}
          instruction={instruction}
        />
      </Camera>
    </View>
  );
};

export default Scanner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
});
