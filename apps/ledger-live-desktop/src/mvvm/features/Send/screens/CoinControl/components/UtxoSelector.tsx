import {
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
import React from "react";
import type { CoinControlDisplayData } from "@ledgerhq/live-common/bridge/descriptor/types";

type UtxoSelectorProps = Readonly<{
  utxoDisplayData: CoinControlDisplayData | null;
  coinToSendLabel: string;
}>;

export const UtxoSelector = ({ utxoDisplayData, coinToSendLabel }: UtxoSelectorProps) => {
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
          <ListItem key={row.rowKey} disabled={row.disabled}>
            <ListItemLeading>
              <ListItemContent>
                <ListItemTitle>{row.titleLabel}</ListItemTitle>
                <ListItemDescription>{row.formattedValue}</ListItemDescription>
              </ListItemContent>
            </ListItemLeading>
            {row.isUsedInTx && (
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
