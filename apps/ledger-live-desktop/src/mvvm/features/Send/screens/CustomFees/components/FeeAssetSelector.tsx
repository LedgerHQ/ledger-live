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
import type { FeeAssetUiOption } from "@ledgerhq/live-common/flows/send/customFees/hooks/useCustomFeesViewModelCore";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";

type FeeAssetSelectorProps = Readonly<{
  options: readonly FeeAssetUiOption[];
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
      <MenuTrigger
        render={
          <ListItem className="cursor-pointer" data-testid="send-fee-asset-select">
            <ListItemLeading>
              <ListItemContent>
                <ListItemTitle>{payFeesInLabel}</ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
            <ListItemTrailing>
              <span className="flex items-center gap-8">
                {selectedOption?.currency && (
                  <CryptoCurrencyIcon currency={selectedOption.currency} size={16} />
                )}
                <span className="body-2-semi-bold text-base">{selectedOption?.ticker ?? ""}</span>
              </span>
              <ChevronRight size={16} />
            </ListItemTrailing>
          </ListItem>
        }
      />
      <MenuContent
        className="w-[var(--anchor-width)] pointer-events-auto"
        side="bottom"
        align="end"
      >
        <MenuRadioGroup value={selectedId} onValueChange={onChange}>
          {options.map(option => (
            <MenuRadioItem
              key={option.id}
              value={option.id}
              closeOnClick
              className="flex cursor-pointer items-center justify-between gap-8"
              data-testid={`send-fee-asset-option-${option.id}`}
            >
              <span className="flex items-center gap-8">
                {option.currency && (
                  <span data-testid={`send-fee-asset-icon-${option.id}`}>
                    <CryptoCurrencyIcon currency={option.currency} size={24} />
                  </span>
                )}
                <span className="body-2-semi-bold text-base">{option.ticker}</span>
              </span>
              {option.formattedBalance !== undefined && (
                <span
                  className="body-2-regular text-muted"
                  data-testid={`send-fee-asset-balance-${option.id}`}
                >
                  {option.formattedBalance}
                </span>
              )}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

export const FeeAssetSelector = memo(FeeAssetSelectorComponent);
