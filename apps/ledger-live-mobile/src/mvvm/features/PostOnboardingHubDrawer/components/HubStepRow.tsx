import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

export type HubStepRowProps = Readonly<{
  leadingIcon: React.ReactNode;
  title: string;
  description?: string;
  tag?: React.ReactNode;
  trailing?: React.ReactNode;
  opacity?: number;
}>;

export function HubStepRow({
  leadingIcon,
  title,
  description,
  tag,
  trailing,
  opacity = 1,
}: HubStepRowProps) {
  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        width: "full",
        alignSelf: "stretch",
        minHeight: "s64",
        paddingVertical: "s12",
        opacity,
      }}
    >
      {leadingIcon}
      <Box lx={{ marginLeft: "s12", flex: 1 }}>
        <Box lx={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: "s8" }}>
          <Text typography="body2SemiBold" lx={{ color: "base", flexShrink: 1 }}>
            {title}
          </Text>
          {tag}
        </Box>
        {description ? (
          <Text typography="body3" lx={{ color: "muted", marginTop: "s4" }}>
            {description}
          </Text>
        ) : null}
      </Box>
      {trailing}
    </Box>
  );
}
