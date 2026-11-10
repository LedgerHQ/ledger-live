import React from "react";
import { StyleSheet } from "react-native";
import WebView from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Banner, Box, Button, IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { Close, ExternalLink, Settings } from "@ledgerhq/lumen-ui-rnative/symbols";
import { MockServerStatusText } from "../../../MockServerStatusText";
import type { MockServerPanelViewModel } from "./useMockServerPanelViewModel";

export function MockServerPanelView({
  status,
  configurationUiUrl,
  pendingAction,
  error,
  onCopyToken,
  onPasteToken,
  onNewSession,
  onSaveDevicesToKnownDevices,
  onOpenConfigurationUi,
  onOpenSettings,
  onClose,
}: Readonly<MockServerPanelViewModel>) {
  const { top, bottom } = useSafeAreaInsets();
  const isBusy = pendingAction !== null;

  return (
    <Box
      testID="mock-server-panel"
      style={[StyleSheet.absoluteFill, { paddingTop: top, paddingBottom: bottom }]}
      lx={{ backgroundColor: "canvas" }}
    >
      <Box lx={{ padding: "s16", gap: "s12" }}>
        <Box lx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Box lx={{ flex: 1, marginRight: "s8" }}>
            <Text typography="heading5SemiBold" lx={{ color: "base" }}>
              Mock server
            </Text>
            <MockServerStatusText status={status} />
          </Box>
          <Box lx={{ flexDirection: "row" }}>
            <IconButton
              appearance="no-background"
              size="sm"
              icon={ExternalLink}
              accessibilityLabel="Open the mock server configuration in the browser"
              onPress={onOpenConfigurationUi}
            />
            <IconButton
              appearance="no-background"
              size="sm"
              icon={Settings}
              accessibilityLabel="Open the mock server settings"
              onPress={onOpenSettings}
            />
            <IconButton
              appearance="no-background"
              size="sm"
              icon={Close}
              accessibilityLabel="Close mock server panel"
              onPress={onClose}
            />
          </Box>
        </Box>

        {status === "sessionExpired" ? (
          <Banner
            appearance="warning"
            title="Session expired"
            description="Start a new session to keep using the mock server."
          />
        ) : null}
        {status === "unreachable" ? (
          <Banner
            appearance="error"
            title="Server unreachable"
            description="Check the server URL in the mock server settings."
          />
        ) : null}
        {error ? <Banner appearance="error" title="Mock server error" description={error} /> : null}

        <Box lx={{ flexDirection: "row", gap: "s8" }}>
          <Button
            appearance="gray"
            size="sm"
            lx={{ flex: 1 }}
            disabled={isBusy}
            onPress={onCopyToken}
          >
            Copy token
          </Button>
          <Button
            appearance="gray"
            size="sm"
            lx={{ flex: 1 }}
            disabled={isBusy}
            loading={pendingAction === "joinSession"}
            onPress={onPasteToken}
          >
            Paste token
          </Button>
          <Button
            appearance="gray"
            size="sm"
            lx={{ flex: 1 }}
            disabled={isBusy}
            loading={pendingAction === "newSession"}
            onPress={onNewSession}
          >
            New session
          </Button>
        </Box>
        <Button
          appearance="gray"
          size="sm"
          disabled={isBusy}
          loading={pendingAction === "saveKnownDevices"}
          onPress={onSaveDevicesToKnownDevices}
        >
          Save mocked devices to known devices
        </Button>
      </Box>

      {status === "connected" ? (
        <WebView
          source={{ uri: configurationUiUrl }}
          style={styles.webview}
          testID="mock-server-webview"
        />
      ) : null}
    </Box>
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1 },
});
