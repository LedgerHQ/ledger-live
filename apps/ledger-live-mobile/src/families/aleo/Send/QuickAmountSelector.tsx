import React, { useCallback, useState } from "react";
import { Linking, Pressable } from "react-native";
import { Flex, Link } from "@ledgerhq/native-ui";
import { ExternalLinkMedium, InformationFill } from "@ledgerhq/native-ui/assets/icons";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { SpeedFast, SpeedLow, SpeedMedium } from "@ledgerhq/lumen-ui-rnative/symbols";
import {
  getEstimatedSigningTime,
  getMaxPrivateRecordsForAccount,
  isAleoTransaction,
  isPrivateTransaction,
  type SigningStrategy,
} from "@ledgerhq/live-common/families/aleo/utils";
import { useAleoQuickAmountSelector } from "@ledgerhq/live-common/families/aleo/react";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
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

export function QuickAmountSelector({
  account,
  transaction,
  updateTransaction,
  maxSpendable,
}: Readonly<AfterAmountInputProps>) {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);
  const quickAmountSelector = useAleoQuickAmountSelector(account, transaction, updateTransaction);
  const [infoOpen, setInfoOpen] = useState(false);
  const onLearnMore = useCallback(() => Linking.openURL(urls.maxSpendable), []);
  const { isKeyboardVisible } = useKeyboardVisible();

  const styles = useStyleSheet(
    t => ({
      tile: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        gap: t.spacings.s4,
        padding: t.spacings.s12,
        borderRadius: t.borderRadius.sm,
        borderWidth: t.borderWidth.s1,
        minHeight: 96,
      },
      tileDefault: {
        backgroundColor: t.colors.bg.muted,
        borderColor: "transparent",
      },
      tileSelected: {
        backgroundColor: t.colors.bg.activeSubtle,
        borderColor: t.colors.border.active,
      },
      tileDisabled: {
        backgroundColor: t.colors.bg.disabled,
        borderColor: "transparent",
      },
      tilePressed: {
        backgroundColor: t.colors.bg.surfacePressed,
      },
      badge: {
        alignItems: "center",
        borderRadius: t.borderRadius.xs,
        paddingHorizontal: t.spacings.s6,
        paddingVertical: t.spacings.s2,
        backgroundColor: t.colors.bg.mutedStrong,
      },
      badgeSelected: {
        backgroundColor: t.colors.bg.active,
      },
      badgeDisabled: {
        backgroundColor: t.colors.bg.disabledStrong,
      },
    }),
    [],
  );

  // Guarded after all hooks above (useTranslation/useAccountUnit/useStyleSheet/
  // useAleoQuickAmountSelector must run unconditionally). This widget is only shown for
  // private transfers — unlike desktop, mobile has no per-mode call site to gate it externally.
  if (
    !isAleoTransaction(transaction) ||
    !isPrivateTransaction(transaction) ||
    !quickAmountSelector.isAleo
  ) {
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
  // Prefer the bridge-estimated value shown by the screen's own "Total available" row, so the two
  // never disagree — totalSpendableBalance (a simpler client-side sum, not fee-aware) is only a
  // fallback while the async estimate hasn't resolved yet.
  const spendableBalance = maxSpendable ?? totalSpendableBalance;

  return (
    <Box>
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
            const labelColor = tile.disabled ? "disabled" : tile.selected ? "active" : "muted";

            return (
              <Pressable
                key={tile.strategy}
                onPress={() => selectStrategy(tile)}
                disabled={tile.disabled || isKeyboardVisible}
                style={({ pressed }) => [
                  styles.tile,
                  tile.disabled
                    ? styles.tileDisabled
                    : tile.selected
                      ? styles.tileSelected
                      : styles.tileDefault,
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
                    —
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
          >
            <Text typography="body4" lx={{ color: "muted" }}>
              {`${t("aleo.send.quickAmountSelector.recordCount", {
                count: selectedRecordsCount,
              })} · ${selectedRecordsSigningTime}`}
            </Text>
          </Box>
        </Box>
      </Box>

      <QueuedDrawer isRequestingToBeOpened={infoOpen} onClose={() => setInfoOpen(false)}>
        <Flex>
          <GenericInformationBody
            Icon={InformationFill}
            iconColor={"primary.c80"}
            title={t("aleo.send.quickAmountSelector.title")}
            description={`${t("aleo.send.tooltip.descPartOne")} ${t("aleo.send.tooltip.descPartTwo", { max: maxRecords })}`}
          />
          <Flex py="6">
            <Link type="main" size="large" Icon={ExternalLinkMedium} onPress={onLearnMore}>
              {t("common.learnMore")}
            </Link>
          </Flex>
        </Flex>
      </QueuedDrawer>
    </Box>
  );
}
