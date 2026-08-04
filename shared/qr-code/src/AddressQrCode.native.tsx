import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import QRCode from "react-native-qrcode-svg";

const DEFAULT_QR_CODE_SIZE = 200;
const DEFAULT_CENTER_WRAPPER_SIZE = 56;

export type AddressQrCodeProps = Readonly<{
  value: string;
  size?: number;
  centerContent?: React.ReactNode;
  testID?: string;
}>;

export function AddressQrCode({
  value,
  size = DEFAULT_QR_CODE_SIZE,
  centerContent,
  testID,
}: AddressQrCodeProps): React.JSX.Element {
  const styles = useStyleSheet(
    t => ({
      qrContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: t.spacings.s24,
        borderRadius: t.sizes.s36,
        backgroundColor: t.colors.bg.canvasOverlaySubtle,
        borderWidth: t.borderWidth.s1,
        borderColor: t.colors.border.base,
      },
      qrSurface: {
        alignItems: "center",
        justifyContent: "center",
        padding: t.spacings.s16,
        borderRadius: t.sizes.s24,
        backgroundColor: "#FFFFFF",
      },
      centerWrapper: {
        alignItems: "center",
        justifyContent: "center",
        width: DEFAULT_CENTER_WRAPPER_SIZE,
        height: DEFAULT_CENTER_WRAPPER_SIZE,
        borderRadius: DEFAULT_CENTER_WRAPPER_SIZE / 2,
        backgroundColor: "#FFFFFF",
      },
    }),
    [],
  );

  return (
    <Box testID={testID} style={styles.qrContainer}>
      <Box style={styles.qrSurface}>
        <Box lx={{ position: "relative", alignItems: "center", justifyContent: "center" }}>
          <QRCode size={size} value={value} ecl="H" />
          {centerContent !== undefined ? (
            <Box lx={{ position: "absolute" }} style={styles.centerWrapper}>
              {centerContent}
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
