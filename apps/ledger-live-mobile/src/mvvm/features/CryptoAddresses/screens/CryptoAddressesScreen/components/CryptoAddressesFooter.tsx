import React from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";

type Props = Readonly<{
  label: string;
  onPress: () => void;
}>;

const PADDING_BOTTOM = 32;

export const FOOTER_HEIGHT = 80;

export default function CryptoAddressesFooter({ label, onPress }: Props) {
  const { bottom } = useSafeAreaInsets();

  return (
    <Box style={[styles.container, { paddingBottom: bottom + PADDING_BOTTOM }]}>
      <Button
        appearance="base"
        size="lg"
        icon={Plus}
        onPress={onPress}
        testID="crypto-addresses-add-button"
      >
        {label}
      </Button>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
