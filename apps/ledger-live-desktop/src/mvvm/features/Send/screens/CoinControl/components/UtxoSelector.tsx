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
  SubheaderInfo,
} from "@ledgerhq/lumen-ui-react";
import { Check } from "@ledgerhq/lumen-ui-react/symbols";
import type { CoinControlDisplayData } from "@ledgerhq/live-common/bridge/descriptor/types";
import React from "react";

type UtxoSelectorProps = Readonly<{
  utxoDisplayData: CoinControlDisplayData | null;
  coinToSendLabel: string;
  isCustomPickingStrategy: boolean;
  hasAmount: boolean;
  onInfoPress: () => void;
  onToggleUtxoExclusion?: (rowKey: string) => void;
}>;

export const UtxoSelector = ({
  utxoDisplayData,
  coinToSendLabel,
  isCustomPickingStrategy,
  hasAmount,
  onInfoPress,
  onToggleUtxoExclusion,
}: UtxoSelectorProps) => {
  const rows = utxoDisplayData?.utxoRows ?? [];

  return (
    <div className="flex flex-col gap-8">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{coinToSendLabel}</SubheaderTitle>
          <SubheaderInfo onClick={onInfoPress} />
        </SubheaderRow>
      </Subheader>
      <div>
        {rows.map(row => {
          const rowDisabled = row.disabled || !hasAmount;
          return (
            <ListItem
              key={row.rowKey}
              disabled={rowDisabled}
              onClick={
                isCustomPickingStrategy && !rowDisabled
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
                      disabled={rowDisabled}
                    />
                  ) : null}
                  <ListItemContent>
                    <ListItemTitle>{row.titleLabel}</ListItemTitle>
                    <ListItemDescription>{row.formattedValue}</ListItemDescription>
                  </ListItemContent>
                </div>
              </ListItemLeading>
              {row.isUsedInTx && !isCustomPickingStrategy && !rowDisabled && (
                <ListItemTrailing>
                  <Check />
                </ListItemTrailing>
              )}
            </ListItem>
          );
        })}
      </div>
    </div>
  );
};
