import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import type { TronifyFeesViewModel } from "../../../types";

type TronifyNudgeProps = Readonly<{
  viewModel: TronifyFeesViewModel;
  onOpenSelector: () => void;
}>;

export function TronifyNudge({ viewModel, onOpenSelector }: TronifyNudgeProps) {
  const { t } = useTranslation();
  const styles = useStyleSheet(
    theme => ({
      nudgeRow: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        paddingVertical: theme.spacings.s8,
      },
      badge: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        paddingHorizontal: theme.spacings.s8,
        paddingVertical: theme.spacings.s4,
        borderRadius: 100,
        backgroundColor: theme.colors.success.background,
      },
    }),
    [],
  );

  if (!viewModel.available) return null;

  if (viewModel.selected) {
    if (viewModel.insufficientBalance) {
      return (
        <View style={styles.nudgeRow}>
          <Text typography="body3" lx={{ color: "error" }}>
            {t("send.newSendFlow.tronifyInsufficientBalance")}
          </Text>
        </View>
      );
    }
    if (!viewModel.savingsFiatFormatted) return null;
    return (
      <Pressable style={styles.nudgeRow} onPress={onOpenSelector}>
        <View style={styles.badge}>
          <Text typography="body3SemiBold" lx={{ color: "success" }}>
            {t("send.newSendFlow.tronifySaved", { savings: viewModel.savingsFiatFormatted })}
          </Text>
        </View>
      </Pressable>
    );
  }

  if (!viewModel.savingsFiatFormatted) return null;

  return (
    <Pressable style={styles.nudgeRow} onPress={onOpenSelector}>
      <Text typography="body3" lx={{ color: "success" }}>
        {t("send.newSendFlow.tronifyNudge", { savings: viewModel.savingsFiatFormatted })}
      </Text>
    </Pressable>
  );
}
