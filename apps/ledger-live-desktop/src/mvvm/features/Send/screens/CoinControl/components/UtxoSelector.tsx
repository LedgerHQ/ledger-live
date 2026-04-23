import {
  Checkbox,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import { Check } from "@ledgerhq/lumen-ui-react/symbols";
import type { CoinControlDisplayData } from "@ledgerhq/live-common/bridge/descriptor/types";
import React from "react";

type UtxoSelectorProps = Readonly<{
  utxoDisplayData: CoinControlDisplayData | null;
  coinToSendLabel: string;
  isCustomPickingStrategy: boolean;
  onToggleUtxoExclusion?: (rowKey: string) => void;
}>;

export const UtxoSelector = ({
  utxoDisplayData,
  coinToSendLabel,
  isCustomPickingStrategy,
  onToggleUtxoExclusion,
}: UtxoSelectorProps) => {
  const rows = utxoDisplayData?.utxoRows ?? [];

  return (
    <div className="flex flex-col gap-12">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{coinToSendLabel}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <div>
        {rows.map(row => (
          <ListItem
            key={row.rowKey}
            disabled={row.disabled}
            onClick={
              isCustomPickingStrategy && !row.disabled
                ? () => {
                    onToggleUtxoExclusion?.(row.rowKey);
                  }
                : undefined
            }
          >
            <ListItemLeading>
              <div className="flex items-center gap-12">
                {isCustomPickingStrategy ? (
                  <Checkbox
                    name={`utxo-${row.rowKey}`}
                    checked={!row.excluded}
                    disabled={row.disabled}
                  />
                ) : null}
                <ListItemContent>
                  <ListItemTitle>{row.titleLabel}</ListItemTitle>
                  <ListItemDescription>{row.formattedValue}</ListItemDescription>
                </ListItemContent>
              </div>
            </ListItemLeading>
            {row.isUsedInTx && !isCustomPickingStrategy && (
              <ListItemTrailing>
                <Check />
              </ListItemTrailing>
            )}
          </ListItem>
        ))}
      </div>
    </div>
  );
};
