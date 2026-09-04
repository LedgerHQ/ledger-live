import { useState, type ReactNode } from "react";
import { Pressable } from "react-native";
import { Box, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";

const HEADER_LX = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s8",
  padding: "s16",
} as const;
const BODY_LX = { paddingHorizontal: "s16", paddingBottom: "s16" } as const;
const CONTAINER_LX = { marginTop: "s16", borderRadius: "sm" } as const;

export function Expand({
  title,
  children,
  defaultExpanded = false,
}: Readonly<{
  title: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
}>) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(defaultExpanded);

  return (
    <Box
      lx={CONTAINER_LX}
      style={{ borderWidth: 1, borderColor: theme.colors.border.mutedSubtle, overflow: "hidden" }}
    >
      <Pressable onPress={() => setOpen(o => !o)}>
        <Box lx={HEADER_LX}>
          <Text typography="body2SemiBold">{open ? "▾" : "▸"}</Text>
          <Box style={{ flex: 1 }}>
            {typeof title === "string" ? <Text typography="body2SemiBold">{title}</Text> : title}
          </Box>
        </Box>
      </Pressable>
      {open ? <Box lx={BODY_LX}>{children}</Box> : null}
    </Box>
  );
}
