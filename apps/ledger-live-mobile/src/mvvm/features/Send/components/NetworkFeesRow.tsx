import React, { useCallback, useMemo } from "react";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import type { FeeSelectorOptionKind, NetworkFeesViewModel } from "../types";
import { useSendFlowData } from "../context/SendFlowContext";
import { useAnalytics } from "~/analytics";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";

type NetworkFeesRowProps = Readonly<{
  viewModel: NetworkFeesViewModel;
}>;

const isStrategyKind = (kind: FeeSelectorOptionKind) => kind === "preset" || kind === "default";

export function NetworkFeesRow({ viewModel }: NetworkFeesRowProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
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
        gap: theme.spacings.s4,
      },
      rightSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacings.s4,
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
        marginVertical: theme.spacings.s8,
      },
    }),
    [],
  );

  const { state } = useSendFlowData();
  const { account, parentAccount } = state.account;

  const { track } = useAnalytics();
  const trackingProperties = useMemo(() => {
    return {
      ...getSendFlowTrackingProperties(account, parentAccount),
      page: "step amount",
      flow: "send",
    };
  }, [account, parentAccount]);

  const handleOpenInfo = useCallback(() => {
    infoBottomSheetRef.current?.present();
  }, [infoBottomSheetRef]);

  const canOpenFeeSelector = viewModel.canOpenSelector;

  const handleOpenSelector = useCallback(() => {
    if (canOpenFeeSelector) {
      selectorBottomSheetRef.current?.present();
    }
  }, [canOpenFeeSelector, selectorBottomSheetRef]);

  const handleSelectOption = useCallback(
    (option: (typeof viewModel.displayOptions)[number]) => {
      if (option.kind !== "coinControl") {
        track("button_clicked", {
          ...trackingProperties,
          button: option.id,
        });
      }

      option.onSelect();
      selectorBottomSheetRef.current?.dismiss();
    },
    [selectorBottomSheetRef, track, trackingProperties],
  );

  const handleCloseInfo = useCallback(() => {
    infoBottomSheetRef.current?.dismiss();
  }, [infoBottomSheetRef]);

  return (
    <>
      <View style={styles.row}>
        <Pressable onPress={handleOpenInfo} style={styles.leftSection}>
          <Text typography="body3" lx={{ color: "base" }}>
            {viewModel.label}
          </Text>
          <Information size={16} lx={{ color: "muted" }} />
        </Pressable>
        <Pressable
          style={styles.rightSection}
          onPress={handleOpenSelector}
          disabled={!canOpenFeeSelector}
        >
          <View style={styles.feeValue}>
            <Text typography="body3" lx={{ color: "base" }}>
              {viewModel.value}
            </Text>
            {viewModel.showFeeCurrencyAmount ? null : (
              <>
                <Text typography="body3" lx={{ color: "muted" }}>
                  •
                </Text>
                <Text typography="body3" lx={{ color: "muted" }}>
                  {viewModel.strategyLabel}
                </Text>
              </>
            )}
          </View>
          {canOpenFeeSelector ? <ChevronDown size={16} /> : null}
        </Pressable>
      </View>

      <BottomSheet ref={infoBottomSheetRef} snapPoints="small">
        <BottomSheetView>
          <BottomSheetHeader
            title={
              viewModel.networkFeesInfo
                ? t(`send.newSendFlow.${viewModel.networkFeesInfo.translationKey}.title`)
                : viewModel.label
            }
            density="compact"
          />
          <View style={styles.infoContent}>
            <Text typography="body2" lx={{ color: "muted" }} style={styles.infoDescription}>
              {viewModel.networkFeesInfo
                ? t(
                    `send.newSendFlow.${viewModel.networkFeesInfo.translationKey}.description`,
                    viewModel.networkFeesInfo.values,
                  )
                : t("send.newSendFlow.feesPaid")}
            </Text>
            <Button appearance="base" size="lg" onPress={handleCloseInfo}>
              {t("common.gotit")}
            </Button>
          </View>
        </BottomSheetView>
      </BottomSheet>

      <BottomSheet ref={selectorBottomSheetRef} enableDynamicSizing snapPoints={null}>
        <BottomSheetView style={{ paddingBottom: bottomInset + 16 }}>
          <BottomSheetHeader title={viewModel.label} density="compact" />

          {viewModel.displayOptions.map((option, index) => {
            const previousOption = viewModel.displayOptions[index - 1];
            // One divider between the strategy group (presets + default) and the extra actions
            // (custom / coin control)
            const needsSeparator =
              !!previousOption &&
              isStrategyKind(previousOption.kind) &&
              !isStrategyKind(option.kind);

            return (
              <React.Fragment key={option.id}>
                {needsSeparator ? (
                  <View style={styles.separator}>
                    <Divider />
                  </View>
                ) : null}
                <Pressable style={styles.presetOption} onPress={() => handleSelectOption(option)}>
                  <View style={styles.presetLeft}>
                    <Text
                      typography="body2SemiBold"
                      lx={{ color: "base" }}
                      style={styles.presetLabel}
                    >
                      {option.label}
                    </Text>
                    {option.sublabel ? (
                      <Text typography="body3" lx={{ color: "muted" }}>
                        {option.sublabel}
                      </Text>
                    ) : null}
                  </View>
                  {option.selected ? (
                    <View style={styles.checkIcon}>
                      <Check size={20} />
                    </View>
                  ) : null}
                </Pressable>
              </React.Fragment>
            );
          })}
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}
