import React, { useEffect, useContext } from "react";
import { StyleSheet, View } from "react-native";
import { BarCodeScanningResult, Camera } from "expo-camera";
import { BarCodeScanner } from "expo-barcode-scanner";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import StyledStatusBar from "./StyledStatusBar";
import CameraScreen from "./CameraScreen";
import HeaderRightClose from "./HeaderRightClose";
import getWindowDimensions from "../logic/getWindowDimensions";
import RequiresCameraPermissions, {
  CameraPermissionContext,
} from "./RequiresCameraPermissions";
import HeaderTitle from "./HeaderTitle";

type Props = {
  onResult: (_: string) => void;
  liveQrCode?: boolean;
  progress?: number;
  instruction?: React.ReactNode | string;
};

const Scanner = ({ onResult, liveQrCode, progress, instruction }: Props) => {
  const hasPermission = useContext(CameraPermissionContext).permissionGranted;
  const { width, height } = getWindowDimensions();
  const navigation = useNavigation();
  const { colors } = useTheme();

  useEffect(() => {
    if (hasPermission) {
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

  if (!hasPermission) return <View />;
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

const ScannerWrappedInRequiresCameraPermission: React.FC<Props> = props => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderRightClose color={colors.neutral.c100} preferDismiss={false} />
      ),
    });
  }, [colors.neutral.c100, navigation]);

  return (
    <RequiresCameraPermissions optimisticlyMountChildren>
      <Scanner {...props} />
    </RequiresCameraPermissions>
  );
};

export default ScannerWrappedInRequiresCameraPermission;
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
});
