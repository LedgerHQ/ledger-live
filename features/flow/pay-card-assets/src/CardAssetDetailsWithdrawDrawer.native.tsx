import React from "react";
import { Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { InformationFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { CardAssetDialogCopy } from "./types";

type CardAssetDetailsWithdrawDrawerProps = Readonly<{
  copy: CardAssetDialogCopy;
  onContinue: () => void;
}>;

export function CardAssetDetailsWithdrawDrawer({
  copy,
  onContinue,
}: CardAssetDetailsWithdrawDrawerProps) {
  return (
    <Box
      lx={{
        alignItems: "center",
        gap: "s32",
        paddingBottom: "s24",
        paddingHorizontal: "s24",
      }}
      testID="card-asset-withdraw-drawer"
    >
      <Box lx={{ alignItems: "center", gap: "s24" }}>
        <Spot appearance="icon" icon={InformationFill} size={56} />
        <Box lx={{ alignItems: "center", gap: "s8" }}>
          <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
            {copy.withdrawTitle}
          </Text>
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            {copy.withdrawDescription}
          </Text>
        </Box>
      </Box>
      <Button appearance="base" size="lg" isFull onPress={onContinue}>
        {copy.continue}
      </Button>
    </Box>
  );
}
