import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "~/context/Locale";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { formatAddress } from "LLM/features/Accounts/utils/formatAddress";

type PasteCardProps = Readonly<{
  clipboardAddress: string;
  onPaste: () => void;
}>;

export function PasteCard({ clipboardAddress, onPaste }: PasteCardProps) {
  const { t } = useTranslation();
  const styles = useStyles();

  const formattedAddress = useMemo(() => formatAddress(clipboardAddress), [clipboardAddress]);

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{t("newSendFlow.pasteFromClipboard")}</Text>
        <Text style={styles.address} numberOfLines={1}>
          {formattedAddress}
        </Text>
      </View>
      <Button appearance="transparent" size="sm" onPress={onPaste}>
        {t("newSendFlow.paste")}
      </Button>
    </View>
  );
}

const useStyles = () =>
  useStyleSheet(
    theme => ({
      container: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.bg.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacings.s12,
        gap: theme.spacings.s16,
      },
      textContainer: {
        flex: 1,
        gap: theme.spacings.s4,
      },
      title: StyleSheet.flatten([
        theme.typographies.body2SemiBold,
        {
          color: theme.colors.text.base,
        },
      ]),
      address: StyleSheet.flatten([
        theme.typographies.body3,
        {
          color: theme.colors.text.muted,
        },
      ]),
    }),
    [],
  );
