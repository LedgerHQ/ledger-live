import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

/** Reminder that DevTools changes affect only the local install. Shown on the root screen. */
export function WarningBanner() {
  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        gap: "s8",
        paddingHorizontal: "s16",
        paddingVertical: "s6",
        backgroundColor: "warning",
      }}
    >
      <Box
        lx={{ width: "s6", height: "s6", borderRadius: "full", backgroundColor: "warningStrong" }}
      />
      <Text typography="body3SemiBold" lx={{ color: "warning" }}>
        Internal tools. Changes here affect only this install.
      </Text>
    </Box>
  );
}

export default WarningBanner;
