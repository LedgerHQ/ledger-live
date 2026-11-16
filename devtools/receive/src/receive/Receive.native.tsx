import type { ReactNode } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Button, Switch, Text, TextInput } from "@ledgerhq/lumen-ui-rnative";
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

export function Receive(props: ReceiveToolProps) {
  const { flag, excludedDraft, setExcludedDraft, applyExcludedFamilies } =
    useReceiveToolViewModel(props);
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
          value={excludedDraft}
          onChangeText={setExcludedDraft}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Box lx={{ alignItems: "flex-end" }}>
          <Button appearance="gray" size="sm" onPress={applyExcludedFamilies}>
            {copy.apply}
          </Button>
        </Box>
      </Section>
    </ScrollView>
  );
}
