import React, { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import {
  CompositeNavigationProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { BarCodeScanningResult, Camera } from "expo-camera";
import { BarCodeScanner } from "expo-barcode-scanner";
import StyledStatusBar from "./StyledStatusBar";
import CameraScreen from "./CameraScreen";
import FallBackCamera from "../screens/ImportAccounts/FallBackCamera";
import getWindowDimensions from "../logic/getWindowDimensions";
import type {
  StackNavigatorNavigation,
  StackNavigatorRoute,
} from "./RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "./RootNavigator/types/BaseNavigator";
import { ImportAccountsNavigatorParamList } from "./RootNavigator/types/ImportAccountsNavigator";

type Props = {
  onResult: (_: string) => void;
  liveQrCode?: boolean;
  progress?: number;
  instruction?: React.ReactNode | string;
};

const Scanner = ({ onResult, liveQrCode, progress, instruction }: Props) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { width, height } = getWindowDimensions();
  const navigation =
    useNavigation<
      CompositeNavigationProp<
        StackNavigatorNavigation<ImportAccountsNavigatorParamList>,
        StackNavigatorNavigation<BaseNavigatorStackParamList>
      >
    >();
  const route = useRoute<StackNavigatorRoute<BaseNavigatorStackParamList>>();
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    // FIXME: OSKOUR pleas use navigation.navigate to access to this component instead of passing
    // the navigation and route props manually
    return <FallBackCamera navigation={navigation} route={route} />;
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
