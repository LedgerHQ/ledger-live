import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { Box, useTheme } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { QrCode } from "@shared/ui-qr-code";
import type { ContactAddressIconProps } from "../../model/resolveContactAddressIcon";

const QR_CODE_SIZE = 200;
const QR_ICON_SIZE = 48;

type ContactAddressDetailQrCodeProps = Readonly<{
  address: string;
  iconProps: ContactAddressIconProps;
}>;

export function ContactAddressDetailQrCode({
  address,
  iconProps,
}: ContactAddressDetailQrCodeProps): React.JSX.Element {
  const { theme } = useTheme();
  const styles = useStyleSheet(
    t => ({
      qrContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: t.spacings.s24,
        borderRadius: t.sizes.s36,
        backgroundColor: t.colors.bg.white,
        boxShadow: t.shadows.lg,
      },
    }),
    [],
  );

  return (
    <Box testID="contacts-address-detail-qr-code" style={styles.qrContainer}>
      <QrCode
        value={address}
        size={QR_CODE_SIZE}
        foregroundColor={theme.colors.bg.black}
        centerContent={
          <CryptoIcon
            ledgerId={iconProps.ledgerId}
            ticker={iconProps.ticker}
            network={iconProps.network}
            badgePosition="bottom-end"
            size={QR_ICON_SIZE}
            shape="circle"
          />
        }
      />
    </Box>
  );
}
