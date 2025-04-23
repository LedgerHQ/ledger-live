import { Button, Text } from "@ledgerhq/react-ui";
import React from "react";
import Box from "~/renderer/components/Box";
import { SettingsSectionRowContainer } from "~/renderer/screens/settings/SettingsSection";

export default function SettingsEntryPoint({ onPress }: { onPress: () => void }) {
  return (
    <SettingsSectionRowContainer tabIndex={-1}>
      <Box grow shrink>
        <Box ff="Inter|SemiBold" color="palette.text.shade100" fontSize={14}>
          Hodl Shield
        </Box>
        <Box
          ff="Inter"
          fontSize={3}
          color="palette.text.shade60"
          mt={1}
          mr={1}
          style={{
            maxWidth: 520,
          }}
        >
          Setup an emergency email to contact
        </Box>
      </Box>

      <Button variant="main" onClick={onPress}>
        <Text color="neutral.c00">Turn on Hodl Shield</Text>
      </Button>
    </SettingsSectionRowContainer>
  );
}
