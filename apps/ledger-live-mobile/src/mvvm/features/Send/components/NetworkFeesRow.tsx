import { track } from "@shared/analytics";
import React, { useCallback, useMemo } from "react";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Text,
  BottomSheet,
  BottomSheetView,
  BottomSheetHeader,
  Divider,
  Tag,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import { Information, ChevronDown, Check } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import { BottomSheetInfoGradient } from "LLM/components/BottomSheetGradient";
import { InfoState } from "@shared/ui-info-state";
import type {
  FeeSelectorOptionKind,
  NetworkFeesViewModel,
  SponsoredFeeEntryViewModel,
} from "../types";
import { useSendFlowTrackingProperties } from "../hooks/useSendFlowTrackingProperties";
import { FeePaymentSheet } from "./FeePaymentSheet";

type NetworkFeesRowProps = Readonly<{
  viewModel: NetworkFeesViewModel;
  /** While set, the fee value opens the fee payment sheet instead of the strategy selector. */
  sponsored?: SponsoredFeeEntryViewModel | null;
}>;

const STRUCK_THROUGH = { textDecorationLine: "line-through" } as const;

const isStrategyKind = (kind: FeeSelectorOptionKind) => kind === "preset" || kind === "default";

type FeeValueProps = Readonly<{
  value: string;
  secondaryValue: string | null;
  /** The standard fee, struck through next to a cheaper sponsored one. */
  originalValue?: string | null;
  testID?: string;
}>;

function FeeValue({ value, secondaryValue, originalValue, testID }: FeeValueProps) {
  return (
    <>
      {originalValue ? (
        <Text
          typography="body3"
          lx={{ color: "muted" }}
          style={STRUCK_THROUGH}
          testID="send-sponsored-fee-original-value"
        >
          {originalValue}
        </Text>
      ) : null}
      <Text typography="body3" lx={{ color: "base" }} testID={testID}>
        {value}
      </Text>
      {secondaryValue ? (
        <Text typography="body3" lx={{ color: "muted" }}>
          {secondaryValue}
        </Text>
      ) : null}
    </>
  );
}

type SponsoredFeeEntryProps = Readonly<{
  entry: SponsoredFeeEntryViewModel;
  /** Shown while the standard fee is picked. */
  standardFee: NetworkFeesViewModel;
  onPress: () => void;
}>;

function SponsoredFeeEntry({ entry, standardFee, onPress }: SponsoredFeeEntryProps) {
  const styles = useStyleSheet(
    theme => ({
      entry: {
        alignItems: "flex-end",
        gap: theme.spacings.s4,
      },
      value: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacings.s4,
      },
    }),
    [],
  );

  return (
    <Pressable
      style={styles.entry}
      onPress={onPress}
      accessibilityRole="button"
      testID="send-fee-payment-entry"
    >
      {entry.label ? (
        <Tag
          appearance={entry.selected ? "success" : "gray"}
          size="sm"
          label={entry.label}
          testID={entry.selected ? "send-sponsored-fee-saved-badge" : "send-sponsored-fee-nudge"}
        />
      ) : null}
      <View style={styles.value}>
        {entry.fee ? (
          <FeeValue
            value={entry.fee.value}
            secondaryValue={entry.fee.secondaryValue}
            originalValue={entry.fee.originalValue}
            testID="send-sponsored-fee-value"
          />
        ) : (
          <FeeValue value={standardFee.value} secondaryValue={standardFee.secondaryValue} />
        )}
        <ChevronDown size={16} />
      </View>
    </Pressable>
  );
}

export function NetworkFeesRow({ viewModel, sponsored }: NetworkFeesRowProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const infoBottomSheetRef = useBottomSheetRef();
  const selectorBottomSheetRef = useBottomSheetRef();
  const feePaymentBottomSheetRef = useBottomSheetRef();

  const styles = useStyleSheet(
    theme => ({
      container: {
        marginBottom: theme.spacings.s8,
      },
      row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: theme.spacings.s12,
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

  const sendFlowTrackingProperties = useSendFlowTrackingProperties();

  const trackingProperties = useMemo(() => {
    return {
      ...sendFlowTrackingProperties,
      page: "step amount",
      flow: "send",
    };
  }, [sendFlowTrackingProperties]);

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
    [selectorBottomSheetRef, trackingProperties],
  );

  const handleCloseInfo = useCallback(() => {
    infoBottomSheetRef.current?.dismiss();
  }, [infoBottomSheetRef]);

  const handleOpenFeePayment = useCallback(() => {
    feePaymentBottomSheetRef.current?.present();
  }, [feePaymentBottomSheetRef]);

  const infoTitle = viewModel.networkFeesInfo
    ? t(`send.newSendFlow.${viewModel.networkFeesInfo.translationKey}.title`)
    : viewModel.label;

  const networkFeesDescription = viewModel.networkFeesInfo
    ? t(
        `send.newSendFlow.${viewModel.networkFeesInfo.translationKey}.description`,
        viewModel.networkFeesInfo.values,
      )
    : t("send.newSendFlow.feesPaid");
  const infoDescription = sponsored?.infoDescription ?? networkFeesDescription;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.row}>
          <Pressable onPress={handleOpenInfo} style={styles.leftSection}>
            <Text typography="body3" lx={{ color: "base" }}>
              {viewModel.label}
            </Text>
            <Information size={16} lx={{ color: "muted" }} />
          </Pressable>
          {sponsored ? (
            // A sponsored fee is priced by its provider, so the strategy presets don't apply to it.
            <SponsoredFeeEntry
              entry={sponsored}
              standardFee={viewModel}
              onPress={handleOpenFeePayment}
            />
          ) : (
            <Pressable
              style={styles.rightSection}
              onPress={handleOpenSelector}
              disabled={!canOpenFeeSelector}
            >
              <View style={styles.feeValue}>
                <FeeValue value={viewModel.value} secondaryValue={viewModel.secondaryValue} />
                {/* A read-only fee has no strategy to name. */}
                {canOpenFeeSelector ? (
                  <>
                    <Text typography="body3" lx={{ color: "muted" }}>
                      •
                    </Text>
                    <Text typography="body3" lx={{ color: "muted" }}>
                      {viewModel.strategyLabel}
                    </Text>
                  </>
                ) : null}
              </View>
              {canOpenFeeSelector ? <ChevronDown size={16} /> : null}
            </Pressable>
          )}
        </View>
        {sponsored?.error ? (
          <Text typography="body3" lx={{ color: "error" }} testID="send-sponsored-fee-error">
            {sponsored.error}
          </Text>
        ) : null}
      </View>

      <BottomSheet
        ref={infoBottomSheetRef}
        enableDynamicSizing
        snapPoints={null}
        backgroundComponent={BottomSheetInfoGradient}
      >
        <BottomSheetView>
          <BottomSheetHeader density="compact" />
          <InfoState
            preset="info"
            size="hug"
            title={infoTitle}
            description={infoDescription}
            primaryCta={{
              label: t("common.gotit"),
              onPress: handleCloseInfo,
            }}
          />
        </BottomSheetView>
      </BottomSheet>

      {sponsored ? <FeePaymentSheet sheetRef={feePaymentBottomSheetRef} /> : null}

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
