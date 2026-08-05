import {
  BottomSheet,
  BottomSheetView,
  BottomSheetHeader,
  Box,
  TextInput,
  IconButton,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import { Refresh, Repair, QrCodeScanner } from "@ledgerhq/lumen-ui-rnative/symbols";
import { Camera } from "react-native-vision-camera";
import { QRScannerSheet } from "../QRScannerSheet/index";
import { TransportPanelProps } from "../../types";
import type { MessageMap } from "@devtools/transport";
import { TransportDebug } from "../TransportDebug";
import { TransportStateIndicator } from "../TransportStateIndicator";
import { RefObject } from "react";

export interface TransportPanelContentProps<M extends MessageMap> {
  bottomSheetRef: RefObject<any>;
  transport: TransportPanelProps<M>;
}

export function TransportPanelContent<M extends MessageMap>({
  bottomSheetRef,
  transport,
}: Readonly<TransportPanelContentProps<M>>) {
  const debugBottomSheetRef = useBottomSheetRef();
  const scannerBottomSheetRef = useBottomSheetRef();

  return (
    <Box>
      <BottomSheet ref={bottomSheetRef} snapPoints="full">
        <BottomSheetView>
          <BottomSheetHeader
            title="Transport State"
            density="compact"
            description="View and edit transport settings"
          />
          <Box lx={{ flexDirection: "column", gap: "s16" }}>
            <TransportStateIndicator
              transportState={transport.transport.getState()}
              role={transport.role}
            />
            {transport.setTarget && transport.target !== undefined && (
              <TextInput
                label="Target"
                value={transport.target ?? ""}
                onChangeText={transport.setTarget}
              />
            )}

            <Box lx={{ flexDirection: "row", alignItems: "flex-end", gap: "s8" }}>
              <Box lx={{ flex: 1 }}>
                <TextInput
                  label="Hub URL"
                  value={transport.hubUrl}
                  onChangeText={transport.setHubUrl}
                />
              </Box>
              <IconButton
                icon={QrCodeScanner}
                accessibilityLabel="Scan QR code"
                appearance="gray"
                onPress={async () => {
                  await Camera.requestCameraPermission();
                  scannerBottomSheetRef.current?.present();
                }}
              />
            </Box>
            <Box lx={{ flexDirection: "row", justifyContent: "space-evenly", gap: "s16" }}>
              <IconButton
                icon={Refresh}
                accessibilityLabel="Refresh"
                appearance="gray"
                onPress={() => transport.transport.setUrl(transport.transport.getState().url)}
              />
              <IconButton
                icon={Repair}
                appearance="gray"
                accessibilityLabel="Debug websocket"
                onPress={() => {
                  debugBottomSheetRef.current?.present();
                }}
              />
            </Box>
          </Box>
        </BottomSheetView>
      </BottomSheet>
      <TransportDebug bottomSheetRef={debugBottomSheetRef} transport={transport} />
      <QRScannerSheet bottomSheetRef={scannerBottomSheetRef} onScan={transport.setHubUrl} />
    </Box>
  );
}
