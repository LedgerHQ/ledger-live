import { useCallback } from "react";
import { useCameraDevice, useCodeScanner, Code } from "react-native-vision-camera";

export function useQRScanner(onScan: (data: string) => void) {
  const device = useCameraDevice("back");

  const onCodeScanned = useCallback(
    (codes: Code[]) => {
      const code = codes[0];
      if (code?.value) {
        onScan(code.value);
      }
    },
    [onScan],
  );

  const codeScanner = useCodeScanner({
    codeTypes: ["qr"],
    onCodeScanned,
  });

  return { device, codeScanner };
}
