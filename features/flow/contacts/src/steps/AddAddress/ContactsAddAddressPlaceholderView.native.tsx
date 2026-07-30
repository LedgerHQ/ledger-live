import React from "react";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import type { AddAddressPlaceholderViewProps } from "./types";

export function ContactsAddAddressPlaceholderView({
  title,
  buttonLabel,
  testID,
  onContinue,
}: AddAddressPlaceholderViewProps): React.JSX.Element {
  return (
    <BottomSheetView testID={testID} style={{ bottom: 0, paddingBottom: 32 }}>
      <BottomSheetHeader density="expanded" />
      <Box style={{ flex: 1 }} lx={{ justifyContent: "space-between" }}>
        <Box lx={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text typography="heading3SemiBold" lx={{ color: "base" }}>
            {title}
          </Text>
        </Box>
        <Button
          testID={`${testID}-continue`}
          appearance="base"
          size="lg"
          isFull
          onPress={onContinue}
        >
          {buttonLabel}
        </Button>
      </Box>
    </BottomSheetView>
  );
}
