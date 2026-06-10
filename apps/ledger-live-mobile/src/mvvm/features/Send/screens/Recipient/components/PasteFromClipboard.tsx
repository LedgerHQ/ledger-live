import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import React from "react";
import { useTranslation } from "~/context/Locale";

type PasteFromClipboardProps = Readonly<{
  address: string;
  onPaste: () => void;
}>;

export const PasteFromClipboard = ({ address, onPaste }: PasteFromClipboardProps) => {
  const { t } = useTranslation();

  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        gap: "s16",
        padding: "s12",
        marginHorizontal: "s8",
        marginBottom: "s16",
        backgroundColor: "muted",
        borderRadius: "md",
      }}
    >
      <Box lx={{ flex: 1, gap: "s4" }}>
        <Text typography="body2SemiBold" lx={{ color: "base" }}>
          {t("send.newSendFlow.pasteFromClipboard.title")}
        </Text>
        <Text typography="body3SemiBold" lx={{ color: "muted" }} numberOfLines={2}>
          {address}
        </Text>
      </Box>
      <Button appearance="transparent" size="sm" onPress={onPaste}>
        {t("send.newSendFlow.pasteFromClipboard.cta")}
      </Button>
    </Box>
  );
};
