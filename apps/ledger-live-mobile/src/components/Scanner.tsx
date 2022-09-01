import React, { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BarCodeScanningResult, Camera } from "expo-camera";
import { BarCodeScanner } from "expo-barcode-scanner";
import StyledStatusBar from "./StyledStatusBar";
import CameraScreen from "./CameraScreen";
import FallBackCamera from "../screens/ImportAccounts/FallBackCamera";
import getWindowDimensions from "../logic/getWindowDimensions";

type Props = {
  onResult: (_: string) => void;
  liveQrCode?: boolean;
  progress?: number;
  instruction?: React.ReactNode | string;
};

const Scanner = ({ onResult, liveQrCode, progress, instruction }: Props) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
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
        onBarCodeScanned={({ data }: BarCodeScanningResult) => onResult(data)}
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
