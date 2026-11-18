import React from "react";
import { View } from "react-native";
import { AmountInput, Text, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { TransferVertical } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import TranslatedError from "~/components/TranslatedError";
import type { AmountInputViewModel, AmountScreenMessage } from "../types";

type AmountInputSectionProps = Readonly<{
  viewModel: AmountInputViewModel;
  message: AmountScreenMessage | null;
  toggleLabel: string;
  compact?: boolean;
}>;

/** Kept in sync with the desktop mapping in `AmountMessageText.tsx`. */
const MESSAGE_COLORS = {
  error: "error",
  warning: "warning",
  info: "base",
} as const;

type Spacings = Readonly<{ s4: number; s8: number; s16: number; s24: number }>;

const MESSAGE_SLOT_MIN_HEIGHT = 20;

function getContainerPadding(spacings: Spacings, compact: boolean) {
  return compact
    ? { paddingTop: spacings.s4, paddingBottom: 0 }
    : { paddingTop: spacings.s24, paddingBottom: spacings.s16 };
}

export function getAmountInputCompactSaving(spacings: Spacings, hasMessage: boolean) {
  const regular = getContainerPadding(spacings, false);
  const compact = getContainerPadding(spacings, true);
  const paddingSaving =
    regular.paddingTop + regular.paddingBottom - compact.paddingTop - compact.paddingBottom;
  const emptyMessageSlotSaving = hasMessage ? 0 : spacings.s8 + MESSAGE_SLOT_MIN_HEIGHT;
  return paddingSaving + emptyMessageSlotSaving;
}

export function AmountInputSection({
  viewModel,
  message,
  toggleLabel,
  compact = false,
}: AmountInputSectionProps) {
  const styles = useStyleSheet(
    theme => ({
      container: {
        alignItems: "center",
        ...getContainerPadding(theme.spacings, compact),
      },
      inputRow: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      },
      toggleButton: {
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: "center",
      },
      secondaryValue: {
        marginTop: theme.spacings.s8,
      },
      messageContainer: {
        marginTop: theme.spacings.s8,
        minHeight: MESSAGE_SLOT_MIN_HEIGHT,
      },
    }),
    [compact],
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <AmountInput
          testID="amount-input"
          value={viewModel.value}
          onChangeText={viewModel.onChangeText}
          currencyText={viewModel.currencyText}
          currencyPosition={viewModel.currencyPosition}
          maxDecimalLength={viewModel.maxDecimalLength}
          editable={!viewModel.isDisabled}
          showSoftInputOnFocus={false}
          isInvalid={message?.type === "error"}
        />
        {viewModel.isFiatModeAvailable && (
          <View style={styles.toggleButton}>
            <IconButton
              testID="amount-mode-toggle"
              icon={TransferVertical}
              size="xs"
              appearance="gray"
              accessibilityLabel={toggleLabel}
              onPress={viewModel.onToggleMode}
            />
          </View>
        )}
      </View>
      {viewModel.isFiatModeAvailable && (
        <Text typography="body2" lx={{ color: "muted" }} style={styles.secondaryValue}>
          {viewModel.secondaryValue}
        </Text>
      )}
      {compact && !message ? null : (
        <View style={styles.messageContainer}>
          {message ? (
            <Text typography="body3" lx={{ color: MESSAGE_COLORS[message.type] }}>
              <TranslatedError error={message.error} />
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}
