import React from "react";
import { Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { WarningFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useBottomSheetBackgroundTone } from "@shared/ui-queued-bottom-sheet";
import type { AddToWalletInstructionsViewProps } from "./useAddToWalletInstructionsViewModel.native";

type WalletErrorSceneProps = Extract<AddToWalletInstructionsViewProps, { scene: "error" }>;

export function WalletErrorScene({
  title,
  description,
  actionLabel,
  backLabel,
  onPressAction,
  onBack,
  isPending,
}: WalletErrorSceneProps) {
  useBottomSheetBackgroundTone("error");

  return (
    <Box testID="pay-card-wallet-error">
      <Box lx={{ alignItems: "center", gap: "s16", paddingHorizontal: "s16" }}>
        <Spot appearance="icon" icon={WarningFill} size={56} />
        <Box lx={{ alignItems: "center", gap: "s8" }}>
          <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
            {title}
          </Text>
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            {description}
          </Text>
        </Box>
      </Box>
      <Box lx={{ gap: "s8", margin: "s16" }}>
        <Button
          appearance="base"
          size="lg"
          isFull
          loading={isPending}
          disabled={isPending}
          onPress={onPressAction}
          accessibilityLabel={actionLabel}
          testID="pay-card-wallet-error-action"
        >
          {actionLabel}
        </Button>
        <Button
          appearance="gray"
          size="lg"
          isFull
          disabled={isPending}
          onPress={onBack}
          accessibilityLabel={backLabel}
          testID="pay-card-wallet-error-back"
        >
          {backLabel}
        </Button>
      </Box>
    </Box>
  );
}
