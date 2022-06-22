import React from "react";
import { Box, Text } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native-gesture-handler";

interface Props {
  label: string;
  amount: number;
}

export function Account({ label, amount }: Props) {
  return (
    <Box flexDirection="row" justifyContent="space-between">
      <TouchableOpacity>
        <Text>{label.toUpperCase()}</Text>
      </TouchableOpacity>

      <Box>
        <Text>{amount}</Text>
      </Box>
    </Box>
  );
}
