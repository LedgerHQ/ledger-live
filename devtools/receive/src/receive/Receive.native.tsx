import type { ReactNode } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  Box,
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  Switch,
  Text,
  TextInput,
} from "@ledgerhq/lumen-ui-rnative";
import type { ReceiveToolProps } from "../types";
import { copy } from "./copy";
import { type ReceiveRow, useReceiveToolViewModel } from "./useReceiveToolViewModel";

const ROW_LX = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "s12",
} as const;

function Section({
  title,
  description,
  children,
}: Readonly<{ title: string; description: string; children: ReactNode }>) {
  return (
    <Box lx={{ gap: "s12", paddingHorizontal: "s16", paddingVertical: "s16" }}>
      <Box lx={{ gap: "s4" }}>
        <Text typography="body1SemiBold" lx={{ color: "base" }}>
          {title}
        </Text>
        <Text typography="body3" lx={{ color: "muted" }}>
          {description}
        </Text>
      </Box>
      {children}
    </Box>
  );
}

function AssetRow({ row }: Readonly<{ row: ReceiveRow }>) {
  return (
    <ListItem onPress={row.onPress} accessibilityLabel={row.accessibilityLabel}>
      <ListItemLeading>
        <CryptoIcon {...row.icon} size={32} />
        <ListItemContent>
          <ListItemTitle>{row.title}</ListItemTitle>
          <ListItemDescription>{row.description}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}

export function Receive(props: ReceiveToolProps) {
  const { flag, excluded, deeplink, rows, pickAsset } = useReceiveToolViewModel(props);
  const { bottom } = useSafeAreaInsets();

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      alwaysBounceVertical={false}
      // The host pads every tool by the bottom inset: run the scroll to the screen edge instead.
      style={{ marginBottom: -bottom }}
      contentContainerStyle={{ paddingBottom: bottom }}
    >
      <Section title={copy.flagTitle} description={copy.flagDescription}>
        <Box lx={ROW_LX}>
          <Text typography="body2" lx={{ color: "base" }} style={{ flexShrink: 1 }}>
            {copy.flagEnabled}
          </Text>
          <Switch
            accessibilityLabel={copy.flagEnabled}
            checked={flag.enabled}
            onCheckedChange={flag.setEnabled}
          />
        </Box>
        <TextInput
          label={copy.excludedFamilies}
          placeholder={copy.excludedFamiliesPlaceholder}
          value={excluded.draft}
          onChangeText={excluded.setDraft}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Box lx={{ alignItems: "flex-end" }}>
          <Button appearance="gray" size="sm" onPress={excluded.apply}>
            {copy.apply}
          </Button>
        </Box>
      </Section>
      <Section title={copy.triggerTitle} description={copy.triggerDescription}>
        <Box lx={{ alignItems: "flex-start" }}>
          <Button appearance="gray" size="sm" onPress={pickAsset}>
            {copy.pickAsset}
          </Button>
        </Box>
        {rows.length === 0 ? (
          <Text typography="body3" lx={{ color: "muted" }}>
            {copy.noAsset}
          </Text>
        ) : (
          <Box>
            {rows.map(row => (
              <AssetRow key={row.key} row={row} />
            ))}
          </Box>
        )}
      </Section>
      <Section title={copy.deeplinkTitle} description={copy.deeplinkDescription}>
        <TextInput
          label={copy.deeplinkLabel}
          value={deeplink.draft}
          onChangeText={deeplink.setDraft}
          helperText={deeplink.error}
          status={deeplink.error && "error"}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Box lx={{ alignItems: "flex-end" }}>
          <Button appearance="gray" size="sm" disabled={!deeplink.canOpen} onPress={deeplink.open}>
            {copy.openDeeplink}
          </Button>
        </Box>
      </Section>
    </ScrollView>
  );
}
