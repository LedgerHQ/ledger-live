import { Box, Button, Divider, Text, TextInput } from "@ledgerhq/lumen-ui-rnative";
import type { ReactNode } from "react";
import {
  DIFF_BASELINES,
  EDITOR_VIEWS,
  type EditorOption,
} from "../../coin-config/internals/editorOptions";
import type { ConfigEditorState } from "../../coin-config/internals/useConfigEditor";
import { ConfigDiffView } from "../configDiffView/ConfigDiffView";

export type ConfigJsonEditorProps = Readonly<
  Pick<
    ConfigEditorState,
    | "json"
    | "setJson"
    | "isJsonValid"
    | "view"
    | "setView"
    | "diffJson"
    | "diffBaseline"
    | "setDiffBaseline"
  >
>;

const GROUP_LX = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s8",
  padding: "s8",
  backgroundColor: "canvas",
} as const;

function ToggleGroup<T extends string>({
  options,
  selected,
  onSelect,
  children,
}: Readonly<{
  options: readonly EditorOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  children?: ReactNode;
}>) {
  return (
    <Box lx={GROUP_LX}>
      {children}
      {options.map(option => (
        <Button
          key={option.value}
          appearance="no-background"
          size="sm"
          onPress={() => onSelect(option.value)}
          lx={{
            borderRadius: "full",
            backgroundColor: option.value === selected ? "activeSubtle" : undefined,
          }}
        >
          {option.label}
        </Button>
      ))}
    </Box>
  );
}

export function ConfigJsonEditor({
  json,
  setJson,
  isJsonValid,
  view,
  setView,
  diffJson,
  diffBaseline,
  setDiffBaseline,
}: ConfigJsonEditorProps) {
  return (
    <Box lx={{ backgroundColor: "canvasMuted", borderRadius: "md" }}>
      <ToggleGroup options={EDITOR_VIEWS} selected={view} onSelect={setView} />
      <Divider />
      {view === "json" ? (
        <Box lx={{ padding: "s8" }}>
          <TextInput
            accessibilityLabel="JSON value"
            value={json}
            onChangeText={setJson}
            multiline
            minLines={10}
            autoCapitalize="none"
            autoCorrect={false}
            inputStyle={{ fontFamily: "monospace" }}
            status={isJsonValid ? undefined : "error"}
            helperText={isJsonValid ? undefined : "Invalid JSON"}
            hideClearButton
          />
        </Box>
      ) : (
        <>
          <ConfigDiffView diff={diffJson} />
          <Divider />
          <ToggleGroup options={DIFF_BASELINES} selected={diffBaseline} onSelect={setDiffBaseline}>
            <Text typography="body3" lx={{ color: "muted" }}>
              Compare with:
            </Text>
          </ToggleGroup>
        </>
      )}
    </Box>
  );
}
