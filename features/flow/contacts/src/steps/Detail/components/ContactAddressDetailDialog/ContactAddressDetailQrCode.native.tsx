import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import type { ContactAddressIconProps } from "../../model/resolveContactAddressIcon";
import { ContactAddressDetailDotQrCode } from "./ContactAddressDetailDotQrCode.native";

const QR_CODE_SIZE = 200;
const QR_ICON_SIZE = 48;
const QR_ICON_WRAPPER_SIZE = 56;

type ContactAddressDetailQrCodeProps = Readonly<{
  address: string;
  iconProps: ContactAddressIconProps;
}>;

export function ContactAddressDetailQrCode({
  address,
  iconProps,
}: ContactAddressDetailQrCodeProps): React.JSX.Element {
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
      iconWrapper: {
        alignItems: "center",
        justifyContent: "center",
        width: QR_ICON_WRAPPER_SIZE,
        height: QR_ICON_WRAPPER_SIZE,
        borderRadius: QR_ICON_WRAPPER_SIZE / 2,
        backgroundColor: "#FFFFFF",
        borderWidth: t.borderWidth.s1,
        borderColor: t.colors.border.base,
      },
    }),
    [],
  );

  return (
    <Box testID="contacts-address-detail-qr-code" style={styles.qrContainer}>
      <Box style={styles.qrSurface}>
        <Box lx={{ position: "relative", alignItems: "center", justifyContent: "center" }}>
          <ContactAddressDetailDotQrCode
            value={address}
            size={QR_CODE_SIZE}
            color="#000000"
          />
          <Box lx={{ position: "absolute" }} style={styles.iconWrapper}>
            <CryptoIcon
              ledgerId={iconProps.ledgerId}
              ticker={iconProps.ticker}
              network={iconProps.network}
              size={QR_ICON_SIZE}
              shape="circle"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
