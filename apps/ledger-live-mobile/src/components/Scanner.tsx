import React, { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { BarCodeScanningResult, Camera, CameraType } from "expo-camera";
import { BarCodeScanner } from "expo-barcode-scanner";
import { Flex } from "@ledgerhq/native-ui";
import StyledStatusBar from "./StyledStatusBar";
import CameraScreen from "./CameraScreen";
import getWindowDimensions from "~/logic/getWindowDimensions";
import RequiresCameraPermissions from "./RequiresCameraPermissions";
import CameraPermissionContext from "./RequiresCameraPermissions/CameraPermissionContext";
import ForceTheme from "./theme/ForceTheme";

type Props = {
  onResult: (_: string) => void;
  liveQrCode?: boolean;
  progress?: number;
  instruction?: React.ReactNode | string;
};

const Scanner = ({ onResult, liveQrCode, progress, instruction }: Props) => {
  const hasPermission = useContext(CameraPermissionContext).permissionGranted;
  const { width, height } = getWindowDimensions();

  if (!hasPermission) return <View />;

  return (
    <ForceTheme selectedPalette="dark">
      <Flex flex={1}>
        <StyledStatusBar barStyle="light-content" />
        <Camera
          style={styles.camera}
          type={CameraType.back}
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
      </Flex>
    </ForceTheme>
  );
};

const ScannerWrappedInRequiresCameraPermission: React.FC<Props> = props => {
  return (
    <RequiresCameraPermissions optimisticallyMountChildren>
      <Scanner {...props} />
    </RequiresCameraPermissions>
  );
};

export default ScannerWrappedInRequiresCameraPermission;
const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
});
