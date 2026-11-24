import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";

/** Side of the square frame holding the camera on the scan tab. */
export const QR_CODE_TAB_FRAME_SIZE = 288;

/** Gap between the rows of a QR code tab. */
export const QR_CODE_TAB_ROW_GAP = 24;

/** Height of the caption row, set by its icon. */
export const QR_CODE_TAB_CAPTION_HEIGHT = 24;

export function QrCodeTabCaption() {
  const { t } = useTranslation();

  return (
    <Flex
      flexDirection={"row"}
      alignItems={"center"}
      columnGap={8}
      minHeight={QR_CODE_TAB_CAPTION_HEIGHT}
      testID="ws-qr-caption"
    >
      <Text variant="bodyLineHeight">{t("walletSync.synchronize.qrCode.scan.description")}</Text>
      <Icons.QrCode size="M" />
    </Flex>
  );
}
