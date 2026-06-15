import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { Pill } from "../pill/Pill.native";
import { memo } from "react";

export interface FlagEnableIndicatorProps {
  readonly enabled: boolean;
}

const CONTAINER_LX = { flexDirection: "row", alignItems: "center", gap: "s4" } as const;
const DOT_ON_LX = { borderRadius: "full", backgroundColor: "successStrong" } as const;
const DOT_OFF_LX = { borderRadius: "full", backgroundColor: "mutedStrong" } as const;
const TEXT_ON_LX = { color: "success" } as const;
const TEXT_OFF_LX = { color: "muted" } as const;
const DOT_STYLE = { width: 6, height: 6 } as const;

function FlagEnableIndicatorComponent({ enabled }: FlagEnableIndicatorProps) {
  return (
    <Pill variant={enabled ? "success" : "muted"} size={3}>
      <Box lx={CONTAINER_LX}>
        <Box lx={enabled ? DOT_ON_LX : DOT_OFF_LX} style={DOT_STYLE} />
        <Text typography="body3" lx={enabled ? TEXT_ON_LX : TEXT_OFF_LX}>
          {enabled ? "On" : "Off"}
        </Text>
      </Box>
    </Pill>
  );
}

export const FlagEnableIndicator = memo(FlagEnableIndicatorComponent);
