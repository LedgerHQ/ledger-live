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
  Box,
} from "@ledgerhq/lumen-ui-rnative";
import React from "react";
import { Check } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { BitcoinUtxoDisplayData } from "@ledgerhq/live-common/families/bitcoin/react";
import { ScrollView } from "react-native";

type UtxoSelectorProps = Readonly<{
  utxoDisplayData: BitcoinUtxoDisplayData | null;
  coinToSendLabel: string;
}>;

export const UtxoSelector = ({ utxoDisplayData, coinToSendLabel }: UtxoSelectorProps) => {
  const rows = utxoDisplayData?.utxoRows ?? [];

  return (
    <Box lx={{ flexDirection: "column", gap: "s12", flex: 1 }} style={{ minHeight: 0 }}>
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{coinToSendLabel}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        {rows.map(row => (
          <ListItem key={`${row.utxo.hash}-${row.utxo.outputIndex}`} disabled={row.disabled}>
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
      </ScrollView>
    </Box>
  );
};
