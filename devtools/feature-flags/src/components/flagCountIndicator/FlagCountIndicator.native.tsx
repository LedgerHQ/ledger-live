import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { FlagFilter } from "../../types";
import { Pill } from "../pill/Pill.native";

export interface FlagCountIndicatorProps {
  readonly filteredCount: number;
  readonly counts: Record<FlagFilter, number>;
}

export function FlagCountIndicator({ filteredCount, counts }: FlagCountIndicatorProps) {
  return (
    <Box lx={{ flexDirection: "row", gap: "s4", alignItems: "center" }}>
      <Text typography="body2" lx={{ color: "base" }}>
        {filteredCount} of {counts.all}
      </Text>
      {counts.overridden > 0 && (
        <>
          <Text typography="body2" lx={{ color: "base" }}>
            ·
          </Text>
          <Pill variant="active">
            <Text typography={`body2`} lx={{ color: "active" }}>
              {counts.overridden} overridden
            </Text>
          </Pill>
        </>
      )}
    </Box>
  );
}
