import { ScrollView } from "react-native";
import { Box, Switch, Text } from "@ledgerhq/lumen-ui-rnative";
import { Lock } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { AppToggle, AppTogglesToolProps } from "../types";
import { copy } from "./copy";

export function AppToggles({ toggles }: AppTogglesToolProps) {
  return (
    <ScrollView>
      <Box lx={{ paddingHorizontal: "s16", paddingVertical: "s12", gap: "s12" }}>
        <Text typography="body2SemiBold" lx={{ color: "base" }}>
          {copy.togglesTitle}
        </Text>
        {toggles.length === 0 ? (
          <Text typography="body3" lx={{ color: "muted" }}>
            {copy.noToggles}
          </Text>
        ) : (
          toggles.map(toggle => <ToggleRow key={toggle.id} toggle={toggle} />)
        )}
      </Box>
    </ScrollView>
  );
}

function ToggleRow({ toggle }: Readonly<{ toggle: AppToggle }>) {
  const isLocked = toggle.lockedReason !== null;

  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "s12",
      }}
    >
      <Box lx={{ flexShrink: 1, gap: "s4" }}>
        <Text typography="body2" lx={{ color: "base" }}>
          {toggle.label}
        </Text>
        <Text typography="body3" lx={{ color: "muted" }}>
          {toggle.description}
        </Text>
        {isLocked && (
          <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
            <Lock size={16} color="muted" />
            <Text typography="body3" lx={{ color: "muted" }}>
              {toggle.lockedReason}
            </Text>
          </Box>
        )}
      </Box>
      <Switch
        size="sm"
        checked={toggle.isOn}
        disabled={isLocked}
        onCheckedChange={toggle.onChange}
        accessibilityLabel={toggle.label}
        testID={`app-toggles-${toggle.id}`}
      />
    </Box>
  );
}
