import React, { useCallback, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet } from "react-native";
import { log } from "@ledgerhq/logs";
import { InformationFill } from "@ledgerhq/native-ui/assets/icons";
import { Box, Link, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { SpeedFast, SpeedLow, SpeedMedium } from "@ledgerhq/lumen-ui-rnative/symbols";
import {
  getEstimatedSigningTime,
  getMaxPrivateRecordsForAccount,
  isAleoTransaction,
  isPrivateTransaction,
} from "@ledgerhq/live-common/families/aleo/utils";
import type { SigningStrategy } from "@ledgerhq/live-common/families/aleo/types";
import { useAleoQuickAmountSelector } from "@ledgerhq/live-common/families/aleo/react";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { useTranslation } from "~/context/Locale";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import InfoIcon from "~/icons/Info";
import QueuedDrawer from "~/components/QueuedDrawer";
import { GenericInformationBody } from "~/components/GenericInformationBody";
import { useKeyboardVisible } from "~/logic/keyboardVisible";
import { urls } from "~/utils/urls";
import type { AfterAmountInputProps } from "~/screens/SendFunds/utils/customSendFlow";

const STRATEGY_ICONS: Record<SigningStrategy, typeof SpeedFast> = {
  fast: SpeedFast,
  balanced: SpeedMedium,
  full: SpeedLow,
};

const selectorStyles = StyleSheet.create({
  scrollContainer: {
    maxHeight: 340,
  },
});

export function QuickAmountSelector({
  account,
  transaction,
  updateTransaction,
  maxSpendable,
}: Readonly<AfterAmountInputProps>) {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);
  const quickAmountSelector = useAleoQuickAmountSelector({
    account,
    transaction,
    updateTransaction,
  });
  const [infoOpen, setInfoOpen] = useState(false);
  const maxSpendableUrl = useLocalizedUrl(urls.maxSpendable);
  const onLearnMore = useCallback(
    () =>
      Linking.openURL(maxSpendableUrl).catch(error => {
        log("aleo-quick-amount-selector", "Failed to open max spendable URL", {
          error,
          url: maxSpendableUrl,
        });
      }),
    [maxSpendableUrl],
  );
  const { isKeyboardVisible } = useKeyboardVisible();

  const styles = useStyleSheet(
    theme => ({
      tile: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacings.s4,
        padding: theme.spacings.s12,
        borderRadius: theme.borderRadius.sm,
        borderWidth: theme.borderWidth.s1,
        minHeight: 96,
      },
      tileDefault: {
        backgroundColor: theme.colors.bg.muted,
        borderColor: "transparent",
      },
      tileSelected: {
        backgroundColor: theme.colors.bg.activeSubtle,
        borderColor: theme.colors.border.active,
      },
      tileDisabled: {
        backgroundColor: theme.colors.bg.disabled,
        borderColor: "transparent",
      },
      tilePressed: {
        backgroundColor: theme.colors.bg.surfacePressed,
      },
      badge: {
        alignItems: "center",
        borderRadius: theme.borderRadius.xs,
        paddingHorizontal: theme.spacings.s6,
        paddingVertical: theme.spacings.s2,
        backgroundColor: theme.colors.bg.mutedStrong,
      },
      badgeSelected: {
        backgroundColor: theme.colors.bg.active,
      },
      badgeDisabled: {
        backgroundColor: theme.colors.bg.disabledStrong,
      },
    }),
    [],
  );

  if (!isAleoTransaction(transaction) || !isPrivateTransaction(transaction)) {
    return null;
  }

  const {
    account: aleoAccount,
    strategyData,
    totalSpendableBalance,
    selectedRecordsCount,
    selectStrategy,
  } = quickAmountSelector;

  const selectedRecordsSigningTime = getEstimatedSigningTime(
    selectedRecordsCount,
    t("time.second_short"),
    t("time.minute_short"),
  );
  const maxRecords = getMaxPrivateRecordsForAccount(aleoAccount);
  const spendableBalance = maxSpendable ?? totalSpendableBalance;

  return (
    <Box>
      {/* Bounded height keeps the tile grid from growing past the keyboard on short devices. */}
      <ScrollView
        style={selectorStyles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => setInfoOpen(true)}
          disabled={isKeyboardVisible}
          style={{ marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <Text typography="body4SemiBold" lx={{ color: "muted" }}>
            {t("aleo.send.quickAmountSelector.title")}
          </Text>
          <InfoIcon size={12} color="grey" />
        </Pressable>

        <Box lx={{ gap: "s16" }}>
          <Box lx={{ flexDirection: "row", gap: "s12" }}>
            {strategyData.map(tile => {
              const Icon = STRATEGY_ICONS[tile.strategy];
              const signingTime = getEstimatedSigningTime(
                tile.availableCount,
                t("time.second_short"),
                t("time.minute_short"),
              );
              let labelColor: "disabled" | "active" | "muted";
              if (tile.disabled) {
                labelColor = "disabled";
              } else if (tile.selected) {
                labelColor = "active";
              } else {
                labelColor = "muted";
              }

              let tileVariantStyle: (typeof styles)[
                | "tileDefault"
                | "tileSelected"
                | "tileDisabled"];
              if (tile.disabled) {
                tileVariantStyle = styles.tileDisabled;
              } else if (tile.selected) {
                tileVariantStyle = styles.tileSelected;
              } else {
                tileVariantStyle = styles.tileDefault;
              }

              return (
                <Pressable
                  key={tile.strategy}
                  onPress={() => selectStrategy(tile)}
                  disabled={tile.disabled || isKeyboardVisible}
                  style={({ pressed }) => [
                    styles.tile,
                    tileVariantStyle,
                    pressed && !tile.disabled && styles.tilePressed,
                  ]}
                >
                  <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
                    <Icon size={16} color={labelColor} />
                    <Text typography="body4SemiBold" lx={{ color: labelColor }}>
                      {t(`aleo.send.quickAmountSelector.strategies.${tile.strategy}`)}
                    </Text>
                  </Box>

                  {tile.disabled ? (
                    <Text typography="body3" lx={{ color: "disabled" }}>
                      {t("aleo.send.quickAmountSelector.noValue")}
                    </Text>
                  ) : (
                    <Text
                      typography="body3SemiBold"
                      lx={{ color: tile.selected ? "active" : "base" }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      <CurrencyUnitValue unit={unit} value={tile.rangeSum} showCode />
                    </Text>
                  )}

                  {!tile.disabled && (
                    <Text typography="body4" lx={{ color: tile.selected ? "active" : "muted" }}>
                      {signingTime}
                    </Text>
                  )}

                  <Box
                    style={[
                      styles.badge,
                      tile.selected && styles.badgeSelected,
                      tile.disabled && styles.badgeDisabled,
                    ]}
                  >
                    <Text
                      typography="body4SemiBold"
                      lx={{ color: tile.disabled ? "disabled" : "onInteractive" }}
                    >
                      {tile.disabled
                        ? t("aleo.send.quickAmountSelector.unavailable")
                        : t("aleo.send.quickAmountSelector.recordCount", {
                            count: tile.availableCount,
                          })}
                    </Text>
                  </Box>
                </Pressable>
              );
            })}
          </Box>

          <Box lx={{ gap: "s4" }}>
            <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
              <Text typography="body4" lx={{ color: "muted" }}>
                {t("aleo.send.quickAmountSelector.spendableBalance")}
              </Text>
              <Text
                typography="body4SemiBold"
                lx={{ color: "muted" }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                <CurrencyUnitValue unit={unit} value={spendableBalance} showCode />
              </Text>
            </Box>
            <Box
              lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}
              style={{ opacity: selectedRecordsCount > 0 ? 1 : 0 }}
              accessibilityElementsHidden={selectedRecordsCount === 0}
              importantForAccessibility={
                selectedRecordsCount === 0 ? "no-hide-descendants" : "auto"
              }
            >
              <Text typography="body4" lx={{ color: "muted" }}>
                {`${t("aleo.send.quickAmountSelector.recordCount", {
                  count: selectedRecordsCount,
                })} · ${selectedRecordsSigningTime}`}
              </Text>
            </Box>
          </Box>
        </Box>
      </ScrollView>

      <QueuedDrawer isRequestingToBeOpened={infoOpen} onClose={() => setInfoOpen(false)}>
        <Box>
          <GenericInformationBody
            Icon={InformationFill}
            iconColor={"primary.c80"}
            title={t("aleo.send.quickAmountSelector.title")}
            description={t("aleo.send.quickAmountSelector.tooltip.desc", { max: maxRecords })}
          />
          <Box lx={{ paddingVertical: "s24", alignItems: "center" }}>
            <Link appearance="base" size="md" underline={false} isExternal onPress={onLearnMore}>
              {t("common.learnMore")}
            </Link>
          </Box>
        </Box>
      </QueuedDrawer>
    </Box>
  );
}
