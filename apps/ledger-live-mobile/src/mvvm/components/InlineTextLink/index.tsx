import React from "react";
import { Linking } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";

type InlineTextLinkProps = Readonly<{
  children?: React.ReactNode;
  href: string;
}>;

/** An underlined, muted link meant to sit inside a sentence of `body2` copy. */
export function InlineTextLink({ children, href }: InlineTextLinkProps) {
  const handlePress = () => {
    void Linking.openURL(href);
  };

  return (
    <Text
      typography="body2"
      lx={{ color: "muted", textDecorationLine: "underline" }}
      onPress={handlePress}
      accessibilityRole="link"
    >
      {children}
    </Text>
  );
}
