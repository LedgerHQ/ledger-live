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
}>;

/** Kept in sync with the desktop mapping in `AmountMessageText.tsx`. */
const MESSAGE_COLORS = {
  error: "error",
  warning: "warning",
  info: "base",
} as const;

export function AmountInputSection({ viewModel, message, toggleLabel }: AmountInputSectionProps) {
  const styles = useStyleSheet(
    theme => ({
      container: {
        alignItems: "center",
        paddingTop: theme.spacings.s24,
        paddingBottom: theme.spacings.s16,
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
        minHeight: 20,
      },
    }),
    [],
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
        <View style={styles.toggleButton}>
          <IconButton
            icon={TransferVertical}
            size="xs"
            appearance="gray"
            accessibilityLabel={toggleLabel}
            onPress={viewModel.onToggleMode}
          />
        </View>
      </View>
      <Text typography="body2" lx={{ color: "muted" }} style={styles.secondaryValue}>
        {viewModel.secondaryValue}
      </Text>
      <View style={styles.messageContainer}>
        {message ? (
          <Text typography="body3" lx={{ color: MESSAGE_COLORS[message.type] }}>
            <TranslatedError error={message.error} />
          </Text>
        ) : null}
      </View>
    </View>
  );
}
