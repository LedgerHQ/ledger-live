import React from "react";
import { Modal } from "react-native";
import { Box, Pressable, Text } from "@ledgerhq/lumen-ui-rnative";
import { Copy } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useCopyToClipboard } from "LLM/hooks/useCopyToClipboard";
import { useCopyIconButtonViewModel } from "../../hooks/useCopyIconButtonViewModel";

type CopyIconButtonProps = Readonly<{
  text: string;
}>;

export function CopyIconButton({ text }: CopyIconButtonProps) {
  const { copyLabel, copiedText } = useCopyIconButtonViewModel();
  const { copyToClipboard, isCopied, resetCopied } = useCopyToClipboard();

  return (
    <>
      <Pressable
        onPress={() => copyToClipboard(text)}
        accessibilityRole="button"
        accessibilityLabel={copyLabel}
      >
        <Copy size={16} color="base" />
      </Pressable>
      <Modal transparent visible={isCopied} animationType="fade" onRequestClose={resetCopied}>
        <Box lx={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Box
            lx={{
              backgroundColor: "surface",
              borderRadius: "sm",
              paddingHorizontal: "s16",
              paddingVertical: "s8",
            }}
          >
            <Text typography="body2SemiBold" lx={{ color: "base" }}>
              {copiedText}
            </Text>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
