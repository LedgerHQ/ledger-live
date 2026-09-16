import React, { useCallback } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheet,
  BottomSheetView,
  BottomSheetHeader,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { Check } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import type { TronifyFeesViewModel } from "../../../types";

type TronifyFeeSelectorRef = Readonly<{ present: () => void; dismiss: () => void }>;

type TronifyFeeSelectorProps = Readonly<{
  bottomSheetRef: React.RefObject<TronifyFeeSelectorRef | null>;
  viewModel: TronifyFeesViewModel;
  onClose: () => void;
}>;

export function TronifyFeeSelector({ bottomSheetRef, viewModel, onClose }: TronifyFeeSelectorProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const styles = useStyleSheet(
    theme => ({
      content: {
        paddingBottom: bottomInset + 16,
      },
      subtitle: {
        paddingHorizontal: theme.spacings.s16,
        marginBottom: theme.spacings.s8,
      },
      option: {
        flexDirection: "row" as const,
        alignItems: "flex-start" as const,
        justifyContent: "space-between" as const,
        paddingHorizontal: theme.spacings.s16,
        paddingVertical: theme.spacings.s16,
      },
      optionLeft: {
        flex: 1,
      },
      optionLabel: {
        marginBottom: theme.spacings.s4,
      },
      feesRow: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: theme.spacings.s8,
        flexWrap: "wrap" as const,
      },
      strikethrough: {
        textDecorationLine: "line-through" as const,
      },
      savingsText: {
        marginTop: theme.spacings.s4,
      },
      checkIcon: {
        marginLeft: theme.spacings.s16,
        marginTop: 2,
      },
      insufficientWarning: {
        paddingHorizontal: theme.spacings.s16,
        paddingTop: theme.spacings.s8,
      },
    }),
    [bottomInset],
  );

  const handleSelectStandard = useCallback(() => {
    viewModel.onSelectStandard();
    onClose();
  }, [viewModel, onClose]);

  const handleSelectTronify = useCallback(() => {
    viewModel.onSelectTronify();
    onClose();
  }, [viewModel, onClose]);

  return (
    <BottomSheet ref={bottomSheetRef} enableDynamicSizing snapPoints={null}>
      <BottomSheetView style={styles.content}>
        <BottomSheetHeader
          title={t("send.newSendFlow.feeSelector.title")}
          density="compact"
        />

        <Text typography="body3" lx={{ color: "muted" }} style={styles.subtitle}>
          {t("send.newSendFlow.feeSelector.subtitle")}
        </Text>

        {/* Regular transfer option */}
        <Pressable style={styles.option} onPress={handleSelectStandard}>
          <View style={styles.optionLeft}>
            <Text typography="body2SemiBold" lx={{ color: "base" }} style={styles.optionLabel}>
              {t("send.newSendFlow.feeSelector.regularTransfer")}
            </Text>
            {viewModel.originalFeeFormatted ? (
              <Text typography="body3" lx={{ color: "muted" }}>
                {viewModel.originalFeeFormatted}
              </Text>
            ) : null}
          </View>
          {!viewModel.selected ? (
            <View style={styles.checkIcon}>
              <Check size={20} />
            </View>
          ) : null}
        </Pressable>

        {/* Pay with Tronify option */}
        <Pressable style={styles.option} onPress={handleSelectTronify}>
          <View style={styles.optionLeft}>
            <Text typography="body2SemiBold" lx={{ color: "base" }} style={styles.optionLabel}>
              {t("send.newSendFlow.feeSelector.payWithTronify")}
            </Text>
            <View style={styles.feesRow}>
              {viewModel.originalFeeFormatted ? (
                <Text
                  typography="body3"
                  lx={{ color: "muted" }}
                  style={styles.strikethrough}
                >
                  {viewModel.originalFeeFormatted}
                </Text>
              ) : null}
              {viewModel.discountedFeeFormatted ? (
                <Text typography="body3" lx={{ color: "base" }}>
                  {viewModel.discountedFeeFormatted}
                </Text>
              ) : null}
            </View>
            {viewModel.savingsFiatFormatted ? (
              <Text
                typography="body3"
                lx={{ color: "success" }}
                style={styles.savingsText}
              >
                {t("send.newSendFlow.tronifySaved", { savings: viewModel.savingsFiatFormatted })}
              </Text>
            ) : null}
          </View>
          {viewModel.selected ? (
            <View style={styles.checkIcon}>
              <Check size={20} />
            </View>
          ) : null}
        </Pressable>

        {viewModel.insufficientBalance && viewModel.selected ? (
          <Text
            typography="body3"
            lx={{ color: "error" }}
            style={styles.insufficientWarning}
          >
            {t("send.newSendFlow.tronifyInsufficientBalance")}
          </Text>
        ) : null}
      </BottomSheetView>
    </BottomSheet>
  );
}
