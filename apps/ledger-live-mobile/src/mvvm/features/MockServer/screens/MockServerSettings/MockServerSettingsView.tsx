import React from "react";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { Banner, Box, Button, IconButton, Text, TextInput } from "@ledgerhq/lumen-ui-rnative";
import { Copy, ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";
import SettingsRow from "~/components/SettingsRow";
import SettingsSwitch from "~/components/Switch";
import SettingsNavigationScrollView from "~/screens/Settings/SettingsNavigationScrollView";
import { MockServerStatusText } from "../../components/MockServerStatusText";
import type { MockServerSettingsViewModel } from "./useMockServerSettingsViewModel";

export function MockServerSettingsView({
  isEnabled,
  status,
  sessionId,
  urlDraft,
  tokenDraft,
  hasDraftChanges,
  pendingAction,
  error,
  onToggle,
  onChangeUrlDraft,
  onChangeTokenDraft,
  onApply,
  onNewSession,
  onCopyToken,
  onOpenConfigurationUi,
}: Readonly<MockServerSettingsViewModel>) {
  const isBusy = pendingAction !== null;

  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="Mock server"
        desc="Replace physical devices with the devices of a mock server session. The app restarts."
        iconLeft={<IconsLegacy.ServerMedium size={32} color="black" />}
      >
        <SettingsSwitch
          value={isEnabled}
          disabled={isBusy}
          onValueChange={onToggle}
          testID="mock-server-toggle"
        />
      </SettingsRow>

      {error ? (
        <Box lx={{ paddingHorizontal: "s16" }}>
          <Banner appearance="error" title="Mock server error" description={error} />
        </Box>
      ) : null}

      <Box lx={{ padding: "s16", gap: "s12" }}>
        {isEnabled ? (
          <Box>
            <MockServerStatusText status={status} />
            {sessionId ? (
              <Text typography="body3" lx={{ color: "muted" }}>
                Session ID: {sessionId}
              </Text>
            ) : null}
          </Box>
        ) : null}

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
          hideClearButton
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

        {isEnabled ? (
          <>
            <Box lx={{ flexDirection: "row", gap: "s8" }}>
              <Button
                appearance="accent"
                size="sm"
                lx={{ flex: 1 }}
                disabled={!hasDraftChanges || isBusy}
                loading={pendingAction === "apply"}
                onPress={onApply}
              >
                Apply & restart
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
              icon={ExternalLink}
              disabled={isBusy}
              onPress={onOpenConfigurationUi}
            >
              Open in browser
            </Button>
          </>
        ) : null}
      </Box>
    </SettingsNavigationScrollView>
  );
}
