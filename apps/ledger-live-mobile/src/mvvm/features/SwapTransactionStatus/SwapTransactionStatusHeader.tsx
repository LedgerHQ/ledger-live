import React from "react";
import { Box, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";

type SwapTransactionStatusHeaderProps = {
  onClose: () => void;
};

export function SwapTransactionStatusHeader({ onClose }: SwapTransactionStatusHeaderProps) {
  const { t } = useTranslation();

  return (
    <Box
      lx={{
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingLeft: "s16",
        paddingRight: "s16",
        paddingTop: "s16",
      }}
    >
      <IconButton
        appearance="transparent"
        size="md"
        icon={Close}
        accessibilityLabel={t("transfer.swap2.modals.transactionStatus.accessibility.close")}
        onPress={onClose}
      />
    </Box>
  );
}
