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

export function AmountInputSection({ viewModel, message, toggleLabel }: AmountInputSectionProps) {
  const styles = useStyleSheet(
    theme => ({
      container: {
        alignItems: "center",
        paddingTop: theme.spacings.s24,
        paddingBottom: theme.spacings.s16,
      },
      inputRow: {
        flexDirection: "row",
        alignItems: "center",
        position: "relative",
      },
      toggleButton: {
        position: "absolute",
        right: -theme.spacings.s48,
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
          <Text
            typography="body3"
            lx={{
              color:
                message.type === "error"
                  ? "error"
                  : message.type === "warning"
                    ? "warning"
                    : "muted",
            }}
          >
            <TranslatedError error={message.error} />
          </Text>
        ) : null}
      </View>
    </View>
  );
}
