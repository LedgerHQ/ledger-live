import React from "react";
import {
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
  ListItemTrailing,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Checkbox,
} from "@ledgerhq/lumen-ui-react";
import { Check } from "@ledgerhq/lumen-ui-react/symbols";
import type { BitcoinUtxoDisplayData } from "../hooks/useBitcoinUtxoDisplayData";
import { bitcoinPickingStrategy, BitcoinPickingStrategy } from "@ledgerhq/coin-bitcoin/lib/types";

type UtxoSelectorProps = Readonly<{
  utxoDisplayData: BitcoinUtxoDisplayData | null;
  strategy?: BitcoinPickingStrategy;
}>;

export const UtxoSelector = ({ utxoDisplayData, strategy }: UtxoSelectorProps) => {
  const rows = utxoDisplayData?.utxoRows ?? [];

  const isCustomStrategy = strategy === bitcoinPickingStrategy.CUSTOM;

  return (
    <div className="flex flex-col gap-12">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>Coin to send</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <div>
        {rows.map((row, index) => (
          <ListItem
            key={`${row.utxo.hash}-${row.utxo.outputIndex}`}
            className={row.disabled ? undefined : "cursor-pointer"}
          >
            <ListItemLeading>
              {isCustomStrategy ? <Checkbox checked={false} /> : null}
              <ListItemContent>
                <ListItemTitle>
                  #{index + 1} {row.utxo.address?.slice(0, 8)}...{row.utxo.address?.slice(-4)}{" "}
                </ListItemTitle>
                <ListItemDescription>{row.formattedValue}</ListItemDescription>
              </ListItemContent>
            </ListItemLeading>
            {!isCustomStrategy && row.isUsedInTx && (
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
