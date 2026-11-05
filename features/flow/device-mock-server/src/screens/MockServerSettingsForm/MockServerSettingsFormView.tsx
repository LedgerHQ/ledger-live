import React from "react";
import {
  Banner,
  Box,
  Button,
  IconButton,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spot,
  Switch,
  Text,
  TextInput,
} from "@ledgerhq/lumen-ui-rnative";
import { Copy, ExternalLink, Servers } from "@ledgerhq/lumen-ui-rnative/symbols";
import { MockServerStatusText } from "../../components/MockServerStatusText";
import type { MockServerSettingsFormViewModel } from "./useMockServerSettingsFormViewModel";

export function MockServerSettingsFormView({
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
}: Readonly<MockServerSettingsFormViewModel>) {
  const isBusy = pendingAction !== null;

  return (
    <Box>
      <Box lx={{ paddingHorizontal: "s16" }}>
        <ListItem>
          <ListItemLeading>
            <Spot size={48} icon={Servers} />
            <ListItemContent>
              <ListItemTitle>Mock server</ListItemTitle>
              <ListItemDescription>Replace physical devices with mock ones</ListItemDescription>
            </ListItemContent>
          </ListItemLeading>
          <ListItemTrailing>
            <Switch
              checked={isEnabled}
              disabled={isBusy}
              onCheckedChange={onToggle}
              testID="mock-server-toggle"
            />
          </ListItemTrailing>
        </ListItem>
      </Box>

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
    </Box>
  );
}
