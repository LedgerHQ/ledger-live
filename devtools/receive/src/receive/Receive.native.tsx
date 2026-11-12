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
  ListItemTrailing,
  SearchInput,
  Switch,
  Text,
  TextInput,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ReceiveToolProps } from "../types";
import { copy } from "./copy";
import { useReceiveToolViewModel } from "./useReceiveToolViewModel";

const ROW_LX = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "s12",
} as const;

function Section({
  title,
  description,
  action,
  children,
}: Readonly<{ title: string; description: string; action?: ReactNode; children: ReactNode }>) {
  return (
    <Box lx={{ gap: "s12", paddingHorizontal: "s16", paddingVertical: "s16" }}>
      <Box lx={{ ...ROW_LX, alignItems: "flex-start" }}>
        <Box lx={{ flex: 1, gap: "s4" }}>
          <Text typography="body1SemiBold" lx={{ color: "base" }}>
            {title}
          </Text>
          <Text typography="body3" lx={{ color: "muted" }}>
            {description}
          </Text>
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
}: Readonly<{ label: string; checked: boolean; onChange: (checked: boolean) => void }>) {
  return (
    <Box lx={ROW_LX}>
      <Text typography="body2" lx={{ color: "base" }} style={{ flexShrink: 1 }}>
        {label}
      </Text>
      <Switch accessibilityLabel={label} checked={checked} onCheckedChange={onChange} />
    </Box>
  );
}

export function Receive(props: ReceiveToolProps) {
  const {
    flag,
    verifyHint,
    trigger,
    assets,
    search,
    setSearch,
    excludedDraft,
    setExcludedDraft,
    applyExcludedFamilies,
    deeplink,
    setDeeplink,
    openDeeplink,
  } = useReceiveToolViewModel(props);
  const { bottom } = useSafeAreaInsets();

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      alwaysBounceVertical={false}
      // The host pads every tool screen by the bottom inset: reclaim it so the list runs to the
      // screen edge, and keep the inset inside the content instead.
      style={{ marginBottom: -bottom }}
      contentContainerStyle={{ paddingBottom: bottom }}
    >
      <Section title={copy.flagTitle} description={copy.flagDescription}>
        <SwitchRow label={copy.flagEnabled} checked={flag.enabled} onChange={flag.setEnabled} />
        <TextInput
          label={copy.excludedFamilies}
          placeholder={copy.excludedFamiliesPlaceholder}
          value={excludedDraft}
          onChangeText={setExcludedDraft}
        />
        <Box lx={{ alignItems: "flex-end" }}>
          <Button appearance="gray" size="sm" onPress={applyExcludedFamilies}>
            {copy.apply}
          </Button>
        </Box>
      </Section>

      <Section title={copy.verifyHintTitle} description={copy.verifyHintDescription}>
        <SwitchRow
          label={copy.verifyHintSeen}
          checked={verifyHint.hasSeen}
          onChange={verifyHint.setHasSeen}
        />
      </Section>

      <Section title={copy.deeplinkTitle} description={copy.deeplinkDescription}>
        <TextInput
          label={copy.deeplinkLabel}
          value={deeplink}
          onChangeText={setDeeplink}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Box lx={{ alignItems: "flex-end" }}>
          <Button appearance="gray" size="sm" onPress={openDeeplink}>
            {copy.openDeeplink}
          </Button>
        </Box>
      </Section>

      <Section
        title={copy.triggerTitle}
        description={copy.triggerDescription}
        action={
          <Button appearance="accent" size="sm" onPress={trigger.onPickAsset}>
            {copy.pickAsset}
          </Button>
        }
      >
        <SearchInput value={search} onChangeText={setSearch} placeholder={copy.searchPlaceholder} />
        {assets.length === 0 ? (
          <Text typography="body2" lx={{ color: "muted" }}>
            {copy.noAsset}
          </Text>
        ) : null}
        <Box lx={{ marginHorizontal: "-s8" }}>
          {assets.map(asset => (
            <ListItem key={asset.id} onPress={() => trigger.onReceive(asset.id)}>
              <ListItemLeading>
                <CryptoIcon
                  ledgerId={asset.currencyId}
                  ticker={asset.ticker}
                  network={asset.networkId}
                  size={40}
                  shape="circle"
                />
                <ListItemContent>
                  <ListItemTitle>{asset.label}</ListItemTitle>
                  <ListItemDescription>{`${asset.ticker} · ${asset.network}`}</ListItemDescription>
                </ListItemContent>
              </ListItemLeading>
              <ListItemTrailing>
                <ChevronRight size={20} />
              </ListItemTrailing>
            </ListItem>
          ))}
        </Box>
      </Section>
    </ScrollView>
  );
}
