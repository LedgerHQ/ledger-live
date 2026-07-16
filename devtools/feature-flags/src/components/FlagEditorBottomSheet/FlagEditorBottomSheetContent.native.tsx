import {
  BottomSheetHeader,
  Switch,
  Box,
  Text,
  Button,
  BottomSheetScrollView,
} from "@ledgerhq/lumen-ui-rnative";
import { FlagJsonEditor } from "../flagJsonEditor/flagJsonEditor";
import { useJsonEditor } from "../../hooks";
import type { FeatureFlagsToolProps, FlagDisplayState } from "../../types";

interface FlagEditorBottomSheetContentProps {
  readonly display: FlagDisplayState;
  readonly setOverride: FeatureFlagsToolProps["setOverride"];
  readonly clearOverride: FeatureFlagsToolProps["clearOverride"];
}

export function FlagEditorBottomSheetContent({
  display,
  setOverride,
  clearOverride,
}: FlagEditorBottomSheetContentProps) {
  const {
    currentJsonFlag,
    setCurrentJsonFlag,
    isJsonValid,
    diffJson,
    diffBaseline,
    setDiffBaseline,
    toggleFeatureFlag,
    overrideWithJson,
    applyDisabled,
    resetJson,
  } = useJsonEditor({ id: display.id, resolved: display.resolved, setOverride });

  return (
    <>
      <BottomSheetHeader title={display.id} />
      <BottomSheetScrollView>
        <Box lx={{ gap: "s8", padding: "s16" }}>
          <Box
            lx={{
              flexDirection: "row",
              justifyContent: "space-between",
              backgroundColor: "canvasMuted",
              borderRadius: "md",
              padding: "s8",
            }}
          >
            <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
              <Switch checked={display.resolved.enabled} onCheckedChange={toggleFeatureFlag} />
              <Text typography="body2SemiBold" lx={{ color: "base" }}>
                {display.resolved.enabled ? "Enabled" : "Disabled"}
              </Text>
            </Box>
            <Button
              onPress={() => {
                resetJson();
                clearOverride(display.id);
              }}
              disabled={!display.isOverridden}
            >
              Restore
            </Button>
          </Box>
          <FlagJsonEditor
            value={currentJsonFlag}
            onChange={setCurrentJsonFlag}
            isValidJson={isJsonValid}
            diffJson={diffJson}
            diffBaseline={diffBaseline}
            setDiffBaseline={setDiffBaseline}
          />
          <Button onPress={overrideWithJson} disabled={applyDisabled}>
            Apply
          </Button>
        </Box>
      </BottomSheetScrollView>
    </>
  );
}
