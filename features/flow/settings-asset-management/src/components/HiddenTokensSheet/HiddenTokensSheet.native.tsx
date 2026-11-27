import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  Box,
  IconButton,
  ListItem,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { Eye } from "@ledgerhq/lumen-ui-rnative/symbols";
import { SettingsSheet } from "@features/flow-settings";
import type { HiddenTokensSheetViewProps } from "../../AssetManagement.types";

type HiddenTokensSheetProps = Readonly<{ sheet: HiddenTokensSheetViewProps }>;

export function HiddenTokensSheet({ sheet }: HiddenTokensSheetProps) {
  return (
    <SettingsSheet
      isOpen={sheet.isOpen}
      title={sheet.title}
      description={sheet.description}
      onClose={sheet.onClose}
      testID="settings-asset-management-hidden-tokens"
    >
      {sheet.groups.length === 0 ? (
        <Text typography="body2" lx={{ color: "muted" }}>
          {sheet.emptyLabel}
        </Text>
      ) : (
        sheet.groups.map(({ network, tokens }) => (
          <Box key={network.id} lx={{ gap: "s4" }}>
            <Subheader>
              <SubheaderRow>
                <SubheaderTitle>{network.name}</SubheaderTitle>
              </SubheaderRow>
            </Subheader>
            {tokens.map(token => (
              <ListItem key={token.id} density="compact" testID={token.testID}>
                <ListItemLeading>
                  <CryptoIcon ledgerId={token.id} ticker={token.ticker} size={32} />
                  <ListItemTitle>{token.name}</ListItemTitle>
                </ListItemLeading>
                <ListItemTrailing>
                  <IconButton
                    appearance="transparent"
                    size="sm"
                    icon={Eye}
                    accessibilityLabel={token.showLabel}
                    onPress={token.onShow}
                  />
                </ListItemTrailing>
              </ListItem>
            ))}
          </Box>
        ))
      )}
    </SettingsSheet>
  );
}
