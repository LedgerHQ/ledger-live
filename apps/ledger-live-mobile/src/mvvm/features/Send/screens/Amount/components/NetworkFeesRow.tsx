import React, { useCallback } from "react";
import { View, Pressable } from "react-native";
import {
  Text,
  Button,
  BottomSheet,
  BottomSheetView,
  BottomSheetHeader,
  Divider,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import { Information, ChevronDown, Check } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import type { NetworkFeesViewModel } from "../types";

type NetworkFeesRowProps = Readonly<{
  viewModel: NetworkFeesViewModel;
}>;

export function NetworkFeesRow({ viewModel }: NetworkFeesRowProps) {
  const { t } = useTranslation();
  const infoBottomSheetRef = useBottomSheetRef();
  const selectorBottomSheetRef = useBottomSheetRef();

  const styles = useStyleSheet(
    theme => ({
      row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: theme.spacings.s12,
        marginBottom: theme.spacings.s8,
      },
      leftSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacings.s8,
      },
      rightSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacings.s8,
      },
      feeValue: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacings.s4,
      },
      infoContent: {
        paddingHorizontal: theme.spacings.s24,
        paddingBottom: theme.spacings.s24,
      },
      infoDescription: {
        marginBottom: theme.spacings.s24,
        textAlign: "center",
      },
      presetOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: theme.spacings.s10,
        paddingHorizontal: theme.spacings.s24,
      },
      presetLeft: {
        flex: 1,
      },
      presetLabel: {
        marginBottom: theme.spacings.s4,
      },
      checkIcon: {
        marginLeft: theme.spacings.s16,
      },
      separator: {
        marginHorizontal: theme.spacings.s24,
        marginVertical: theme.spacings.s8,
      },
    }),
    [],
  );

  const handleOpenInfo = useCallback(() => {
    infoBottomSheetRef.current?.present();
  }, [infoBottomSheetRef]);

  const handleOpenSelector = useCallback(() => {
    if (viewModel.showFeePresets) {
      selectorBottomSheetRef.current?.present();
    }
  }, [viewModel.showFeePresets, selectorBottomSheetRef]);

  const handleSelectStrategy = useCallback(
    (strategy: string) => {
      viewModel.onSelectFeeStrategy(strategy);
      selectorBottomSheetRef.current?.dismiss();
    },
    [viewModel, selectorBottomSheetRef],
  );

  const handleCloseInfo = useCallback(() => {
    infoBottomSheetRef.current?.dismiss();
  }, [infoBottomSheetRef]);

  return (
    <>
      <View style={styles.row}>
        <Pressable onPress={handleOpenInfo} style={styles.leftSection}>
          <Text typography="body2" lx={{ color: "base" }}>
            {viewModel.label}
          </Text>
          <Information size={16} />
        </Pressable>
        <Pressable
          style={styles.rightSection}
          onPress={handleOpenSelector}
          disabled={!viewModel.showFeePresets}
        >
          <View style={styles.feeValue}>
            <Text typography="body2SemiBold" lx={{ color: "base" }}>
              {viewModel.value}
            </Text>
            <Text typography="body3" lx={{ color: "muted" }}>
              •
            </Text>
            <Text typography="body3" lx={{ color: "muted" }}>
              {viewModel.strategyLabel}
            </Text>
          </View>
          {viewModel.showFeePresets ? <ChevronDown size={16} /> : null}
        </Pressable>
      </View>

      <BottomSheet ref={infoBottomSheetRef} snapPoints="small">
        <BottomSheetView>
          <BottomSheetHeader title={viewModel.label} appearance="compact" />
          <View style={styles.infoContent}>
            <Text typography="body2" lx={{ color: "muted" }} style={styles.infoDescription}>
              {t("send.newSendFlow.feesPaid")}
            </Text>
            <Button appearance="base" size="lg" onPress={handleCloseInfo}>
              {t("common.gotit")}
            </Button>
          </View>
        </BottomSheetView>
      </BottomSheet>

      <BottomSheet ref={selectorBottomSheetRef} snapPoints="medium">
        <BottomSheetView>
          <BottomSheetHeader title={viewModel.label} appearance="compact" />

          {viewModel.feePresetOptions.map(option => {
            const isSelected = viewModel.selectedFeeStrategy === option.id;

            return (
              <Pressable
                key={option.id}
                style={styles.presetOption}
                onPress={() => handleSelectStrategy(option.id)}
              >
                <View style={styles.presetLeft}>
                  <Text
                    typography="body2SemiBold"
                    lx={{ color: "base" }}
                    style={styles.presetLabel}
                  >
                    {option.label}
                  </Text>
                  {option.fiatValue ? (
                    <Text typography="body3" lx={{ color: "muted" }}>
                      {option.fiatValue}
                    </Text>
                  ) : null}
                </View>
                {isSelected ? (
                  <View style={styles.checkIcon}>
                    <Check size={20} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}

          {viewModel.uiConfig?.hasCustomFees || viewModel.uiConfig?.hasCoinControl ? (
            <View style={styles.separator}>
              <Divider />
            </View>
          ) : null}

          {viewModel.uiConfig?.hasCustomFees ? (
            <Pressable style={styles.presetOption} onPress={() => handleSelectStrategy("custom")}>
              <View style={styles.presetLeft}>
                <Text typography="body2SemiBold" lx={{ color: "base" }}>
                  {t("send.fees.customFees")}
                </Text>
              </View>
              {viewModel.selectedFeeStrategy === "custom" ? (
                <View style={styles.checkIcon}>
                  <Check size={20} />
                </View>
              ) : null}
            </Pressable>
          ) : null}

          {viewModel.uiConfig?.hasCoinControl ? (
            <Pressable
              style={styles.presetOption}
              onPress={() => handleSelectStrategy("coinControl")}
            >
              <View style={styles.presetLeft}>
                <Text typography="body2SemiBold" lx={{ color: "base" }}>
                  {t("send.fees.coinControl")}
                </Text>
              </View>
            </Pressable>
          ) : null}
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}
