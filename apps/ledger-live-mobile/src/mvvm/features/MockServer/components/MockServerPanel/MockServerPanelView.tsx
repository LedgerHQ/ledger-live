import React from "react";
import { StyleSheet } from "react-native";
import WebView from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Banner,
  Box,
  Button,
  IconButton,
  Switch,
  Text,
  TextInput,
} from "@ledgerhq/lumen-ui-rnative";
import { Close, Copy } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { MockServerStatus } from "../../types";
import type { MockServerPanelViewModel } from "./useMockServerPanelViewModel";

const STATUS_LABELS: Record<MockServerStatus, string> = {
  checking: "Checking…",
  connected: "Connected",
  unreachable: "Server unreachable",
  sessionExpired: "Session expired",
};

const STATUS_COLORS: Record<MockServerStatus, "muted" | "success" | "error" | "warning"> = {
  checking: "muted",
  connected: "success",
  unreachable: "error",
  sessionExpired: "warning",
};

export function MockServerPanelView({
  status,
  sessionId,
  frontendUrl,
  urlDraft,
  tokenDraft,
  hasDraftChanges,
  pendingAction,
  error,
  isFloatingButtonHidden,
  onChangeUrlDraft,
  onChangeTokenDraft,
  onApply,
  onNewSession,
  onCopyToken,
  onSetFloatingButtonHidden,
  onClose,
}: MockServerPanelViewModel) {
  const { top, bottom } = useSafeAreaInsets();

  return (
    <Box
      testID="mock-server-panel"
      style={[StyleSheet.absoluteFill, { paddingTop: top, paddingBottom: bottom }]}
      lx={{ backgroundColor: "canvas" }}
    >
      <Box lx={{ padding: "s16", gap: "s12" }}>
        <Box lx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Text typography="heading5SemiBold" lx={{ color: "base" }}>
              Mock server
            </Text>
            <Text typography="body2" lx={{ color: STATUS_COLORS[status] }}>
              {STATUS_LABELS[status]}
              {sessionId ? ` · session ${sessionId}` : ""}
            </Text>
          </Box>
          <IconButton
            appearance="no-background"
            size="sm"
            icon={Close}
            accessibilityLabel="Close mock server panel"
            onPress={onClose}
          />
        </Box>

        {status === "sessionExpired" ? (
          <Banner
            appearance="warning"
            title="Session expired"
            description="Start a new session to keep using the mock server."
          />
        ) : null}
        {error ? <Banner appearance="error" title="Mock server error" description={error} /> : null}

        <TextInput
          label="Server URL"
          value={urlDraft}
          onChangeText={onChangeUrlDraft}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <TextInput
          label="Session token"
          value={tokenDraft}
          onChangeText={onChangeTokenDraft}
          autoCapitalize="none"
          autoCorrect={false}
          suffix={
            <IconButton
              appearance="no-background"
              size="xs"
              icon={Copy}
              accessibilityLabel="Copy session token"
              onPress={onCopyToken}
            />
          }
        />

        <Box lx={{ flexDirection: "row", gap: "s8" }}>
          <Button
            appearance="accent"
            size="sm"
            lx={{ flex: 1 }}
            disabled={!hasDraftChanges || pendingAction !== null}
            loading={pendingAction === "apply"}
            onPress={onApply}
          >
            Apply & restart
          </Button>
          <Button
            appearance="gray"
            size="sm"
            lx={{ flex: 1 }}
            disabled={pendingAction !== null}
            loading={pendingAction === "newSession"}
            onPress={onNewSession}
          >
            New session
          </Button>
        </Box>

        <Box lx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text typography="body2" lx={{ color: "base" }}>
            Hide floating button until restart
          </Text>
          <Switch checked={isFloatingButtonHidden} onCheckedChange={onSetFloatingButtonHidden} />
        </Box>
      </Box>

      <WebView source={{ uri: frontendUrl }} style={styles.webview} testID="mock-server-webview" />
    </Box>
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1 },
});
