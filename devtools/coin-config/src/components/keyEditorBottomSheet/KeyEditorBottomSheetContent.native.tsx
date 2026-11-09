import {
  BottomSheetHeader,
  BottomSheetScrollView,
  Box,
  Button,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import type { CoinConfigToolProps, KeyDisplayState } from "../../types";
import { useConfigEditor } from "../../coin-config/internals/useConfigEditor";
import { ConfigJsonEditor } from "../configJsonEditor/ConfigJsonEditor";
import { Pill } from "../pill/Pill";

export interface KeyEditorBottomSheetContentProps {
  readonly display: KeyDisplayState;
  readonly setOverride: CoinConfigToolProps["setOverride"];
  readonly clearOverride: CoinConfigToolProps["clearOverride"];
}

const STATUS_LX = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "canvasMuted",
  borderRadius: "md",
  padding: "s8",
} as const;

export function KeyEditorBottomSheetContent({
  display,
  setOverride,
  clearOverride,
}: KeyEditorBottomSheetContentProps) {
  const editor = useConfigEditor({ display, setOverride, clearOverride });

  return (
    <>
      <BottomSheetHeader title={display.key} />
      <BottomSheetScrollView>
        <Box lx={{ gap: "s8", padding: "s16" }}>
          <Box lx={STATUS_LX}>
            <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8", flexShrink: 1 }}>
              <Pill variant={display.isOverridden ? "active" : "muted"}>{display.valueType}</Pill>
              <Text typography="body2SemiBold" lx={{ color: "base" }}>
                {display.isOverridden ? "Overridden locally" : "Remote or default value"}
              </Text>
            </Box>
            <Button onPress={editor.restore} disabled={!display.isOverridden}>
              Restore
            </Button>
          </Box>
          <ConfigJsonEditor {...editor} />
          <Button onPress={editor.apply} disabled={editor.applyDisabled}>
            Apply
          </Button>
        </Box>
      </BottomSheetScrollView>
    </>
  );
}
