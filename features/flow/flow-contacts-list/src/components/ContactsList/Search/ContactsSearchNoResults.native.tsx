import React from "react";
import { View } from "react-native";
import { Box, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { Search } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

type ContactsSearchNoResultsProps = Readonly<{
  message: string;
}>;

export function ContactsSearchNoResults({
  message,
}: ContactsSearchNoResultsProps): React.JSX.Element {
  return (
    <Box testID="contacts-search-no-results" lx={statusStyle}>
      <View style={topSpacerStyle} />
      <Spot appearance="icon" icon={Search} size={72} />
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
