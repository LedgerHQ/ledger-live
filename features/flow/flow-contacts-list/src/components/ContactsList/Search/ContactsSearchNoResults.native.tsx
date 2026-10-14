import React from "react";
import { View } from "react-native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useKeyboardOverlap } from "./useKeyboardOverlap.native";

type ContactsSearchNoResultsProps = Readonly<{
  title: string;
  description?: string;
}>;

export function ContactsSearchNoResults({
  title,
  description,
}: ContactsSearchNoResultsProps): React.JSX.Element {
  const { containerRef, onContainerLayout, keyboardOverlap } = useKeyboardOverlap();

  return (
    <View
      ref={containerRef}
      onLayout={onContainerLayout}
      style={{ flex: 1, paddingBottom: keyboardOverlap }}
    >
      <Box testID="contacts-search-no-results" lx={statusStyle}>
        <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {title}
        </Text>
        {description ? (
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            {description}
          </Text>
        ) : null}
      </Box>
    </View>
  );
}

const statusStyle: LumenViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: "s8",
  padding: "s8",
};
