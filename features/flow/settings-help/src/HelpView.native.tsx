import React from "react";
import { ScrollView } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { SettingsConfirmSheet } from "@features/flow-settings";
import { HelpGroup } from "./components/HelpGroup/HelpGroup";
import type { HelpViewProps } from "./HelpView.types";

/** The title is the app's: its navigator header shows it. */
export function HelpView({ groups, confirmation, slots, whileConfirming, testID }: HelpViewProps) {
  return (
    <>
      <ScrollView testID={testID}>
        <Box lx={{ paddingHorizontal: "s8", paddingTop: "s8", gap: "s24" }}>
          {groups.map(group => (
            <HelpGroup key={group.id} group={group} slots={slots} />
          ))}
        </Box>
      </ScrollView>
      <SettingsConfirmSheet {...confirmation} />
      {confirmation.isOpen ? whileConfirming : null}
    </>
  );
}
