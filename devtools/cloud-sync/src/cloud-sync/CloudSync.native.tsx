import { useCallback, useState } from "react";
import { ScrollView, TextInput } from "react-native";
import { Box, Button, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";
import { useCloudSyncViewModel } from "./useCloudSyncViewModel";
import type { CloudSyncDevToolProps } from "../types";

const ENV_ROW_LX = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s12",
  padding: "s16",
} as const;
const STATUS_LX = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s8",
  padding: "s16",
} as const;
const ACTIONS_LX = {
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "s8",
  padding: "s16",
} as const;
const DOC_LX = { padding: "s16", gap: "s8" } as const;
const ENV_BTN_LX = { flexDirection: "row", gap: "s4" } as const;

export function CloudSync(props: CloudSyncDevToolProps) {
  const vm = useCloudSyncViewModel(props);
  const { theme } = useTheme();

  const [pullError, setPullError] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [destroyError, setDestroyError] = useState<string | null>(null);

  const handlePull = useCallback(async () => {
    setPullError(null);
    try {
      await vm.pull();
    } catch (e) {
      setPullError(String(e));
    }
  }, [vm]);

  const handlePush = useCallback(async () => {
    setPushError(null);
    try {
      await vm.push();
    } catch (e) {
      setPushError(String(e));
    }
  }, [vm]);

  const handleDestroy = useCallback(async () => {
    setDestroyError(null);
    try {
      await vm.destroy();
    } catch (e) {
      setDestroyError(String(e));
    }
  }, [vm]);

  return (
    <ScrollView>
      {/* Backend row */}
      <BackendRow url={vm.cloudSyncApiBaseUrl} useProd={vm.useProd} setUseProd={vm.setUseProd} />

      {/* Status row */}
      <Box
        lx={STATUS_LX}
        style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}
      >
        {vm.isReady ? (
          <>
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.colors.text.success,
              }}
            />
            <Text typography="body2">Connected</Text>
            {vm.version ? <Text typography="body2">v{vm.version}</Text> : null}
          </>
        ) : (
          <>
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.colors.text.error,
              }}
            />
            <Text typography="body2">No trustchain — open the Trustchain tool first</Text>
          </>
        )}
        {vm.liveState?.trustchain ? (
          <Text typography="body2" numberOfLines={1} style={{ marginLeft: "auto" }}>
            {vm.liveState.trustchain.rootId.slice(0, 8)}…
          </Text>
        ) : null}
      </Box>

      {/* Actions */}
      <Box
        lx={ACTIONS_LX}
        style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}
      >
        <ActionBtn label="Pull" onPress={handlePull} disabled={!vm.isReady} error={pullError} />
        <ActionBtn label="Push" onPress={handlePush} disabled={!vm.canPush} error={pushError} />
        {vm.listening ? (
          <Button size="sm" appearance="transparent" onPress={vm.stopListen}>
            Stop
          </Button>
        ) : (
          <ActionBtn
            label="Listen"
            onPress={vm.listen}
            disabled={!vm.isReady}
            error={vm.listenError}
          />
        )}
        <ActionBtn
          label="Destroy"
          onPress={handleDestroy}
          disabled={!vm.isReady}
          error={destroyError}
        />
        {vm.listening ? (
          <Text typography="body2" style={{ color: theme.colors.text.success }}>
            ● listening…
          </Text>
        ) : null}
      </Box>

      {/* JSON — editable; Push sends the current content */}
      <Box lx={DOC_LX}>
        <Text typography="body2">Document</Text>
        <TextInput
          multiline
          value={vm.json}
          onChangeText={vm.setJson}
          placeholder="Pull to load the cloud document…"
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            borderWidth: 1,
            borderColor: theme.colors.border.mutedSubtle,
            borderRadius: 4,
            padding: 8,
            minHeight: 200,
            textAlignVertical: "top",
            color: theme.colors.text.base,
          }}
        />
      </Box>
    </ScrollView>
  );
}

function BackendRow({
  url,
  useProd,
  setUseProd,
}: Readonly<{
  url: string;
  useProd?: boolean;
  setUseProd?: (v: boolean) => void;
}>) {
  const { theme } = useTheme();
  return (
    <Box
      lx={ENV_ROW_LX}
      style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}
    >
      <Text typography="body2">Backend</Text>
      <Text typography="body2" numberOfLines={1} style={{ flex: 1 }}>
        {url}
      </Text>
      {setUseProd ? (
        <Box lx={ENV_BTN_LX}>
          <EnvButton label="STG" active={!useProd} onPress={() => setUseProd(false)} />
          <EnvButton label="PROD" active={!!useProd} onPress={() => setUseProd(true)} />
        </Box>
      ) : null}
    </Box>
  );
}

function EnvButton({
  label,
  active,
  onPress,
}: Readonly<{
  label: string;
  active: boolean;
  onPress: () => void;
}>) {
  return (
    <Button size="sm" appearance={active ? "accent" : "transparent"} onPress={onPress}>
      {label}
    </Button>
  );
}

function ActionBtn({
  label,
  onPress,
  disabled,
  error,
}: Readonly<{
  label: string;
  onPress: () => void;
  disabled: boolean;
  error: string | null;
}>) {
  const { theme } = useTheme();
  return (
    <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" } as const}>
      <Button size="sm" appearance="transparent" disabled={disabled} onPress={onPress}>
        {label}
      </Button>
      {error ? (
        <Text typography="body2" style={{ color: theme.colors.text.error }}>
          {error}
        </Text>
      ) : null}
    </Box>
  );
}

export default CloudSync;
