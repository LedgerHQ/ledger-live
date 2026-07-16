import { Divider, Button, Box, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";
import { TextInput } from "react-native";
import { useState } from "react";
import { FlagDiffView } from "../flagDiffView/FlagDiffView";
import type { DiffLine } from "../../utils";
import type { DiffBaseline } from "../../hooks";

export interface FlagJsonEditorProps {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly isValidJson: boolean;
  readonly diffJson: DiffLine[];
  readonly diffBaseline: DiffBaseline;
  readonly setDiffBaseline: (baseline: DiffBaseline) => void;
}

export function FlagJsonEditor({
  value,
  onChange,
  isValidJson,
  diffJson,
  diffBaseline,
  setDiffBaseline,
}: FlagJsonEditorProps) {
  const [onJsonEditor, setOnJsonEditor] = useState<boolean>(true);
  const { theme } = useTheme();

  return (
    <Box lx={{ backgroundColor: "canvasMuted", borderRadius: "md" }}>
      <Box
        lx={{
          flexDirection: "row",
          alignItems: "center",
          gap: "s8",
          padding: "s8",
          backgroundColor: "canvas",
        }}
      >
        <Button
          appearance="no-background"
          size="sm"
          onPress={() => setOnJsonEditor(true)}
          lx={{ borderRadius: "full", backgroundColor: onJsonEditor ? "activeSubtle" : undefined }}
        >
          JSON Editor
        </Button>
        <Button
          appearance="no-background"
          size="sm"
          onPress={() => setOnJsonEditor(false)}
          lx={{ borderRadius: "full", backgroundColor: onJsonEditor ? undefined : "activeSubtle" }}
        >
          Review Changes
        </Button>
      </Box>
      <Divider />
      {onJsonEditor ? (
        <Box
          lx={{ padding: "s8", borderRadius: "md" }}
          style={
            isValidJson ? undefined : { borderWidth: 2, borderColor: theme.colors.border.error }
          }
        >
          <TextInput
            value={value}
            onChangeText={onChange}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              minHeight: 200,
              fontFamily: "monospace",
              fontSize: 12,
              color: theme.colors.text.base,
              textAlignVertical: "top",
            }}
          />
        </Box>
      ) : (
        <>
          <FlagDiffView diff={diffJson} />
          <Divider />
          <Box
            lx={{
              flexDirection: "row",
              alignItems: "center",
              gap: "s8",
              padding: "s8",
              backgroundColor: "canvas",
            }}
          >
            <Text typography="body3" lx={{ color: "muted" }}>
              Compare with:
            </Text>
            <Button
              appearance="no-background"
              size="sm"
              onPress={() => setDiffBaseline("default")}
              lx={{
                borderRadius: "full",
                backgroundColor: diffBaseline === "default" ? "activeSubtle" : undefined,
              }}
            >
              Defaults
            </Button>
            <Button
              appearance="no-background"
              size="sm"
              onPress={() => setDiffBaseline("resolved")}
              lx={{
                borderRadius: "full",
                backgroundColor: diffBaseline === "resolved" ? "activeSubtle" : undefined,
              }}
            >
              Resolved
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
