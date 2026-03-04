import React, { memo } from "react";
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import type { FeeAssetOption } from "@ledgerhq/live-common/bridge/descriptor";

type FeeAssetSelectorProps = Readonly<{
  options: readonly FeeAssetOption[];
  selectedId: string;
  onChange: (id: string) => void;
  payFeesInLabel: string;
}>;

function FeeAssetSelectorComponent({
  options,
  selectedId,
  onChange,
  payFeesInLabel,
}: FeeAssetSelectorProps) {
  const selectedOption = options.find(o => o.id === selectedId);

  return (
    <Menu>
      <MenuTrigger asChild>
        <ListItem className="cursor-pointer" data-testid="send-fee-asset-select">
          <ListItemLeading>
            <ListItemContent>
              <ListItemTitle>{payFeesInLabel}</ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
          <ListItemTrailing>
            <span className="body-2-semi-bold text-base">{selectedOption?.ticker ?? ""}</span>
            <ChevronRight size={16} />
          </ListItemTrailing>
        </ListItem>
      </MenuTrigger>
      <MenuContent side="bottom" align="end">
        <MenuRadioGroup value={selectedId} onValueChange={onChange}>
          {options.map(option => (
            <MenuRadioItem
              key={option.id}
              value={option.id}
              data-testid={`send-fee-asset-option-${option.id}`}
            >
              {option.ticker}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

export const FeeAssetSelector = memo(FeeAssetSelectorComponent);
