import React from "react";
import { Box, Link, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";

const BOTTOM_ALIGNED = { marginTop: "auto" } as const;

type CardDisclaimerProps = {
  readonly text: string;
  readonly link: string;
  readonly onPress: () => void;
};

export function CardDisclaimer({ text, link, onPress }: CardDisclaimerProps) {
  const { theme } = useTheme();

  return (
    <Box
      lx={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "s4",
        paddingHorizontal: "s16",
        paddingTop: "s16",
        marginBottom: "s8",
      }}
      style={BOTTOM_ALIGNED}
      testID="pay-card-disclaimer"
    >
      <Text typography="body3" lx={{ color: "muted", textAlign: "center" }}>
        {text}
      </Text>
      <Link
        appearance="base"
        typography="body3"
        size="sm"
        onPress={onPress}
        style={{ color: theme.colors.text.muted }}
        testID="pay-card-disclaimer-link"
      >
        {link}
      </Link>
    </Box>
  );
}
