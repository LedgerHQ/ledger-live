import React from "react";
import { View } from "react-native";
import { Box, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import type { SpotProps } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

type Props = Readonly<{
  icon: Extract<SpotProps, { appearance: "icon" }>["icon"];
  message: string;
  testID?: string;
}>;

export function StatusView({ icon, message, testID }: Props) {
  return (
    <Box lx={statusStyle} testID={testID}>
      <View style={topSpacerStyle} />
      <Spot appearance="icon" icon={icon} size={72} />
      <Text
        typography="heading4SemiBold"
        lx={{ color: "base", textAlign: "center", marginTop: "s24" }}
      >
        {message}
      </Text>
    </Box>
  );
}

const statusStyle: LumenViewStyle = { flex: 1, alignItems: "center", paddingHorizontal: "s16" };
const topSpacerStyle = { height: "30%" } as const;
