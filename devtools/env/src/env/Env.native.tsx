import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, TextInput } from "react-native";
import { Box, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";
import type { EnvDevToolProps, EnvVarEntry } from "../types";

const ROW_LX = { padding: "s12", gap: "s4" } as const;
const KV_LX = { flexDirection: "row", alignItems: "center", gap: "s8" } as const;
const INPUT_ROW_LX = { flexDirection: "row", alignItems: "center", gap: "s8" } as const;

export function Env({ envVars, onOverride, onReset }: EnvDevToolProps) {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? envVars.filter(
        e =>
          e.key.toLowerCase().includes(query.toLowerCase()) ||
          e.desc.toLowerCase().includes(query.toLowerCase()),
      )
    : envVars;

  return (
    <ScrollView>
      <Box
        lx={{ padding: "s12" }}
        style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}
      >
        <TextInput
          placeholder="Filter env vars…"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border.mutedSubtle,
            borderRadius: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            fontSize: 13,
            color: theme.colors.text.base,
          }}
        />
      </Box>
      {filtered.map(entry => (
        <EnvRow key={entry.key} entry={entry} onOverride={onOverride} onReset={onReset} />
      ))}
    </ScrollView>
  );
}

function EnvRow({
  entry,
  onOverride,
  onReset,
}: Readonly<{
  entry: EnvVarEntry;
  onOverride: (key: string, rawValue: string) => void;
  onReset: (key: string) => void;
}>) {
  const { theme } = useTheme();
  const [draft, setDraft] = useState<string | null>(null);
  const skipNextBlurRef = useRef(false);

  const commit = useCallback(
    (value: string) => {
      if (skipNextBlurRef.current) {
        skipNextBlurRef.current = false;
        return;
      }
      if (value !== entry.value) onOverride(entry.key, value);
      setDraft(null);
    },
    [entry.key, entry.value, onOverride],
  );

  const displayed = draft ?? entry.value;

  return (
    <Box lx={ROW_LX} style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}>
      <Box lx={KV_LX}>
        <Text typography="body2SemiBold" style={{ fontFamily: "monospace" }} numberOfLines={1}>
          {entry.key}
        </Text>
        {entry.isOverridden ? (
          <Text typography="body3" style={{ color: theme.colors.text.success }}>
            overridden
          </Text>
        ) : null}
      </Box>
      {entry.desc ? (
        <Text typography="body3" style={{ color: theme.colors.text.muted }}>
          {entry.desc}
        </Text>
      ) : null}
      <Box lx={INPUT_ROW_LX}>
        <TextInput
          value={displayed}
          onChangeText={setDraft}
          onEndEditing={e => commit(e.nativeEvent.text)}
          onSubmitEditing={e => commit(e.nativeEvent.text)}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: entry.isOverridden
              ? theme.colors.border.success
              : theme.colors.border.mutedSubtle,
            borderRadius: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            fontSize: 13,
            fontFamily: "monospace",
            color: theme.colors.text.base,
          }}
        />
        {entry.isOverridden ? (
          <Pressable
            onPressIn={() => {
              skipNextBlurRef.current = true;
            }}
            onPress={() => {
              onReset(entry.key);
              setDraft(null);
            }}
            style={{ paddingHorizontal: 8, paddingVertical: 4 }}
          >
            <Text typography="body2">↺</Text>
          </Pressable>
        ) : null}
      </Box>
    </Box>
  );
}

export default Env;
