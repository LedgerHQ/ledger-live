import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

export function Loading() {
  return (
    <Box testID="devtools-loading" lx={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text typography="body2" lx={{ color: "muted" }}>
        Loading…
      </Text>
    </Box>
  );
}
