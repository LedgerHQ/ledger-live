import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";

/** Side of the square frame holding the camera or the QR code, so both tabs keep one layout. */
export const QR_CODE_TAB_FRAME_SIZE = 288;

type Props = Readonly<{
  /** Keeps the caption's height without showing it, so the tab without one does not move. */
  isHidden?: boolean;
}>;

export function QrCodeTabCaption({ isHidden = false }: Props) {
  const { t } = useTranslation();

  return (
    <Flex
      flexDirection={"row"}
      alignItems={"center"}
      columnGap={8}
      opacity={isHidden ? 0 : 1}
      accessibilityElementsHidden={isHidden}
      importantForAccessibility={isHidden ? "no-hide-descendants" : "auto"}
      testID={isHidden ? "ws-qr-caption-placeholder" : "ws-qr-caption"}
    >
      <Text variant="bodyLineHeight">{t("walletSync.synchronize.qrCode.scan.description")}</Text>
      <Icons.QrCode />
    </Flex>
  );
}
