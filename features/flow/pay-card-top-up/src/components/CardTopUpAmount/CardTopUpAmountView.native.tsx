import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { AmountInput, Box, Button, IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo, TransferVertical } from "@ledgerhq/lumen-ui-rnative/symbols";
import { Trans, useTranslation } from "@shared/i18n";
import type { CardTopUpAmountViewProps } from "../../types";
import { AmountKeypad } from "./AmountKeypad.native";
import { applyAmountKey } from "./amountKeys";

const ignoreTyping = () => undefined;

export function CardTopUpAmountView({
  amountText,
  currencyText,
  currencyPosition,
  maxDecimalLength,
  secondaryValue,
  canToggleInputMode,
  amountError,
  ratios,
  canSubmit,
  onAmountChange,
  onToggleInputMode,
  onSubmit,
  onOpenLegal,
}: CardTopUpAmountViewProps) {
  const { t } = useTranslation();

  const pressKey = useCallback(
    (key: string) => onAmountChange(applyAmountKey(amountText, key, maxDecimalLength)),
    [amountText, maxDecimalLength, onAmountChange],
  );

  const legalLink = (
    <Text
      typography="body4"
      lx={{ color: "muted" }}
      style={styles.link}
      onPress={onOpenLegal}
      accessibilityRole="link"
    />
  );

  return (
    <Box lx={{ flex: 1, paddingBottom: "s16" }}>
      <Box lx={{ flex: 1, justifyContent: "center", paddingHorizontal: "s24" }}>
        <Box lx={{ flexDirection: "row", alignItems: "center" }}>
          <Box lx={{ flex: 1, alignItems: "center", gap: "s8", paddingLeft: "s32" }}>
            <AmountInput
              value={amountText}
              currencyText={currencyText}
              currencyPosition={currencyPosition}
              maxDecimalLength={maxDecimalLength}
              autoFocus
              showSoftInputOnFocus={false}
              // The in-app keypad is the only input path, so the field is display-only.
              onChangeText={ignoreTyping}
              isInvalid={amountError !== null}
              testID="card-top-up-amount-input"
            />
            {secondaryValue ? (
              <Text typography="body2" lx={{ color: "muted" }} testID="card-top-up-secondary-value">
                {secondaryValue}
              </Text>
            ) : null}
          </Box>
          {canToggleInputMode ? (
            <IconButton
              icon={TransferVertical}
              size="xs"
              appearance="gray"
              accessibilityLabel={t("payTab.cardTopUp.toggleInputMode")}
              onPress={onToggleInputMode}
              testID="card-top-up-toggle-input-mode"
            />
          ) : (
            <Box lx={{ width: "s32" }} />
          )}
        </Box>
        {amountError ? (
          <Text
            typography="body3"
            lx={{ color: "error", textAlign: "center", marginTop: "s8" }}
            testID="card-top-up-amount-error"
          >
            {amountError}
          </Text>
        ) : null}
      </Box>

      <Box lx={{ gap: "s12" }}>
        <Box
          lx={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: "s24",
          }}
        >
          {ratios.map(ratio => (
            <Button
              key={ratio.id}
              appearance="gray"
              disabled={ratio.disabled}
              onPress={ratio.onSelect}
              testID={`card-top-up-ratio-${ratio.id}`}
            >
              {ratio.label}
            </Button>
          ))}
        </Box>

        <Box lx={{ paddingHorizontal: "s48" }}>
          <AmountKeypad
            onKeyPress={pressKey}
            deleteAccessibilityLabel={t("payTab.cardTopUp.keypadDelete")}
          />
        </Box>

        <Box lx={{ gap: "s8", paddingHorizontal: "s16" }}>
          <Button
            appearance="base"
            size="lg"
            isFull
            icon={LedgerLogo}
            disabled={!canSubmit}
            onPress={onSubmit}
            testID="card-top-up-submit"
          >
            {t("payTab.cardTopUp.review")}
          </Button>
          <Text typography="body4" lx={{ color: "muted", textAlign: "center" }}>
            <Trans
              i18nKey="payTab.cardTopUp.disclaimer"
              components={{ termsLink: legalLink, privacyLink: legalLink }}
            />
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  link: {
    textDecorationLine: "underline",
  },
});
