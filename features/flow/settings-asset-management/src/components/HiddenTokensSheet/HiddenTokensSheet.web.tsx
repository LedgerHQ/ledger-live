import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import {
  IconButton,
  ListItem,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import { Eye } from "@ledgerhq/lumen-ui-react/symbols";
import { SettingsSheet } from "@features/flow-settings";
import type { HiddenTokensSheetViewProps } from "../../AssetManagement.types";

type HiddenTokensSheetProps = Readonly<{ sheet: HiddenTokensSheetViewProps }>;

export function HiddenTokensSheet({ sheet }: HiddenTokensSheetProps) {
  return (
    <SettingsSheet
      isOpen={sheet.isOpen}
      title={sheet.title}
      description={sheet.description}
      headerDensity="expanded"
      onClose={sheet.onClose}
      testID="settings-asset-management-hidden-tokens"
    >
      <div className="flex max-h-[400px] flex-col gap-16 overflow-y-auto pt-4">
        {sheet.groups.length === 0 ? (
          <span className="body-2 text-muted">{sheet.emptyLabel}</span>
        ) : (
          sheet.groups.map(({ network, tokens }) => (
            <div key={network.id} className="flex flex-col gap-4">
              <Subheader>
                <SubheaderRow>
                  <SubheaderTitle as="h3">{network.name}</SubheaderTitle>
                </SubheaderRow>
              </Subheader>
              {tokens.map(token => (
                <ListItem
                  key={token.id}
                  density="compact"
                  className="shrink-0"
                  data-testid={token.testID}
                >
                  <ListItemLeading>
                    <CryptoIcon ledgerId={token.id} ticker={token.ticker} size={32} />
                    <ListItemTitle className="body-2-semi-bold">{token.name}</ListItemTitle>
                  </ListItemLeading>
                  <ListItemTrailing>
                    <IconButton
                      appearance="transparent"
                      size="sm"
                      icon={Eye}
                      aria-label={token.showLabel}
                      tooltip
                      onClick={token.onShow}
                    />
                  </ListItemTrailing>
                </ListItem>
              ))}
            </div>
          ))
        )}
      </div>
    </SettingsSheet>
  );
}
