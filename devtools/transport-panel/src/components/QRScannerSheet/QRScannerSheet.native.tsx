import { useCallback, type RefObject } from "react";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from "react-native-vision-camera";
import {
  BottomSheet,
  BottomSheetView,
  BottomSheetHeader,
  Box,
  Text,
} from "@ledgerhq/lumen-ui-rnative";

interface Props {
  readonly bottomSheetRef: RefObject<any>;
  readonly onScan: (value: string) => void;
}

export function QRScannerSheet({ bottomSheetRef, onScan }: Props) {
  const { hasPermission } = useCameraPermission();
  const device = useCameraDevice("back");

  const codeScanner = useCodeScanner({
    codeTypes: ["qr"],
    onCodeScanned: useCallback(
      codes => {
        const value = codes[0]?.value;
        if (value) {
          onScan(value);
          bottomSheetRef.current?.dismiss();
        }
      },
      [onScan, bottomSheetRef],
    ),
  });

  return (
    <BottomSheet ref={bottomSheetRef} snapPoints="fullWithOffset">
      <BottomSheetView>
        <BottomSheetHeader title="Scan relay QR" density="compact" />
        <Box lx={{ alignItems: "center", padding: "s16" }}>
          {hasPermission && device ? (
            <Camera
              device={device}
              isActive
              style={{ width: 280, height: 280, borderRadius: 16 }}
              codeScanner={codeScanner}
            />
          ) : (
            <Text>Camera permission required</Text>
          )}
        </Box>
      </BottomSheetView>
    </BottomSheet>
  );
}
