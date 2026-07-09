import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

interface StatusRowProps {
  label: string;
  ok: boolean | null;
  hint?: string;
}

const STATUS = {
  yes: { color: "success", label: "Yes" },
  no: { color: "error", label: "No" },
  unknown: { color: "muted", label: "—" },
} as const;

export const StatusRow = ({ label, ok, hint }: StatusRowProps) => {
  const status = ok === null ? STATUS.unknown : ok ? STATUS.yes : STATUS.no;

  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: "s8",
      }}
    >
      <Box lx={{ flex: 1, marginRight: "s16" }}>
        <Text typography="body3SemiBold" lx={{ color: "base" }}>
          {label}
        </Text>
        {hint && (
          <Text typography="body3" lx={{ color: "muted", marginTop: "s4" }}>
            {hint}
          </Text>
        )}
      </Box>
      <Text typography="body3SemiBold" lx={{ color: status.color }}>
        {status.label}
      </Text>
    </Box>
  );
};
