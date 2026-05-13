import React, { useEffect, useRef, useState } from "react";
import { Modal } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { Box, Pressable, Text } from "@ledgerhq/lumen-ui-rnative";
import { Copy } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";

type CopyIconButtonProps = {
  text: string;
};

export function CopyIconButton({ text }: CopyIconButtonProps) {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copyToClipboard = () => {
    Clipboard.setString(text);
    setIsCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsCopied(false), 1_000);
  };

  return (
    <>
      <Pressable
        onPress={copyToClipboard}
        accessibilityRole="button"
        accessibilityLabel={t("transfer.swap2.modals.transactionStatus.accessibility.copySwapId")}
      >
        <Copy size={16} color="base" />
      </Pressable>
      <Modal transparent visible={isCopied} animationType="fade">
        <Box lx={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Box
            lx={{
              backgroundColor: "black",
              borderRadius: "sm",
              paddingHorizontal: "s16",
              paddingVertical: "s8",
            }}
          >
            <Text typography="body2SemiBold" lx={{ color: "white" }}>
              {t("transfer.swap2.modals.transactionStatus.actions.copied")}
            </Text>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
