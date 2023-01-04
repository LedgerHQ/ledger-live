import React, { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { BarCodeScanningResult, Camera } from "expo-camera";
import { BarCodeScanner } from "expo-barcode-scanner";
import { useTheme } from "styled-components/native";
import {
  CompositeNavigationProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import StyledStatusBar from "./StyledStatusBar";
import CameraScreen from "./CameraScreen";
import HeaderRightClose from "./HeaderRightClose";
import FallbackCameraScreen from "../screens/ImportAccounts/FallBackCameraScreen";
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
  const { colors } = useTheme();
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    if (hasPermission === false) {
      navigation.setOptions({
        headerRight: () => (
          <HeaderRightClose color={colors.neutral.c100} preferDismiss={false} />
        ),
      });
    } else if (hasPermission) {
      navigation.setOptions({
        headerRight: () => (
          <HeaderRightClose
            color={colors.constant.white}
            preferDismiss={false}
          />
        ),
      });
    }
  }, [colors, hasPermission, navigation]);

  switch (hasPermission) {
    case null:
      return <View />;
    case false:
      return <FallbackCameraScreen route={route} navigation={navigation} />;
    default:
      return (
        <View style={styles.container}>
          <StyledStatusBar barStyle="light-content" />
          <Camera
            style={styles.camera}
            type={Camera.Constants.Type.back}
            ratio="16:9"
            onBarCodeScanned={({ data }: BarCodeScanningResult) =>
              onResult(data)
            }
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
  }
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
