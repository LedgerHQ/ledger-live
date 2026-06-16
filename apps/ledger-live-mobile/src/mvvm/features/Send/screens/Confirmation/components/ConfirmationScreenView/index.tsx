import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { StatusGradient } from "LLM/components/StatusGradient";

export type ConfirmationScreenViewProps = Readonly<{
  title: string;
  description: string;
  viewTransactionLabel: string;
  closeLabel: string;
  canViewTransaction: boolean;
  onViewTransaction: () => void;
  onClose: () => void;
}>;

export function ConfirmationScreenView({
  title,
  description,
  viewTransactionLabel,
  closeLabel,
  canViewTransaction,
  onViewTransaction,
  onClose,
}: ConfirmationScreenViewProps) {
  const styles = useStyleSheet(
    theme => ({
      container: {
        flex: 1,
        backgroundColor: theme.colors.bg.base,
      },
    }),
    [],
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
      testID="send-confirmation-success"
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <StatusGradient tone="success" testID="send-confirmation-success-gradient" />
      </View>

      <Box lx={{ flex: 1, paddingHorizontal: "s16", paddingVertical: "s24" }}>
        <Box lx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "s24" }}>
          <Spot appearance="check" size={72} />
          <Box lx={{ gap: "s8", alignItems: "center" }}>
            <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
              {title}
            </Text>
            <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
              {description}
            </Text>
          </Box>
        </Box>

        <Box lx={{ gap: "s12" }}>
          {canViewTransaction ? (
            <Button
              appearance="gray"
              size="lg"
              lx={{ width: "full" }}
              onPress={onViewTransaction}
              testID="send-confirmation-success-view-transaction"
            >
              {viewTransactionLabel}
            </Button>
          ) : null}
          <Button
            appearance="base"
            size="lg"
            lx={{ width: "full" }}
            onPress={onClose}
            testID="send-confirmation-success-close"
          >
            {closeLabel}
          </Button>
        </Box>
      </Box>
    </SafeAreaView>
  );
}
