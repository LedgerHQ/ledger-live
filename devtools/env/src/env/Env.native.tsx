import { useCallback, useRef, useState } from "react";
import { Platform, ScrollView } from "react-native";
import { Box, IconButton, SearchInput, Tag, Text, TextInput } from "@ledgerhq/lumen-ui-rnative";
import { RefreshBack } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { EnvDevToolProps, EnvVarEntry } from "../types";

const ROW_LX = { paddingHorizontal: "s12", paddingVertical: "s8", gap: "s8" } as const;
const MONO = { fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }) };
const KV_LX = { flexDirection: "row", alignItems: "center", gap: "s8" } as const;
const INPUT_ROW_LX = { flexDirection: "row", alignItems: "center", gap: "s8" } as const;

function Env({ envVars, onOverride, onReset }: EnvDevToolProps) {
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
      <Box lx={{ padding: "s12" }}>
        <SearchInput
          placeholder="Filter env vars…"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
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
    <Box lx={ROW_LX}>
      <Box lx={KV_LX}>
        <Text
          typography="body2SemiBold"
          lx={{ color: "base", flexShrink: 1 }}
          style={MONO}
          numberOfLines={1}
        >
          {entry.key}
        </Text>
        {entry.isOverridden ? <Tag size="sm" appearance="success" label="overridden" /> : null}
      </Box>
      {entry.desc ? (
        <Text typography="body3" lx={{ color: "muted" }}>
          {entry.desc}
        </Text>
      ) : null}
      <Box lx={INPUT_ROW_LX}>
        <TextInput
          lx={{ flex: 1 }}
          value={displayed}
          onChangeText={setDraft}
          onEndEditing={e => commit(e.nativeEvent.text)}
          onSubmitEditing={e => commit(e.nativeEvent.text)}
          returnKeyType="done"
          submitBehavior="blurAndSubmit"
          multiline
          minLines={1}
          maxLines={4}
          autoCapitalize="none"
          autoCorrect={false}
          status={entry.isOverridden ? "success" : undefined}
          hideClearButton
        />
        {entry.isOverridden ? (
          <IconButton
            appearance="gray"
            size="sm"
            icon={RefreshBack}
            accessibilityLabel={`Reset to: ${entry.defaultValue}`}
            onPressIn={() => {
              skipNextBlurRef.current = true;
            }}
            onPress={() => {
              onReset(entry.key);
              setDraft(null);
            }}
          />
        ) : null}
      </Box>
    </Box>
  );
}

export default Env;
