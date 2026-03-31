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
  Checkbox,
} from "@ledgerhq/lumen-ui-rnative";
import type { CoinControlDisplayData } from "@ledgerhq/live-common/bridge/descriptor/types";
import React from "react";
import { Check } from "@ledgerhq/lumen-ui-rnative/symbols";
import { ScrollView } from "react-native";

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

  const handleToggle = React.useCallback(
    (rowKey: string, disabled: boolean) => {
      if (!isCustomPickingStrategy || disabled) return;
      onToggleUtxoExclusion?.(rowKey);
    },
    [isCustomPickingStrategy, onToggleUtxoExclusion],
  );

  return (
    <Box lx={{ flexDirection: "column", gap: "s12", flex: 1 }} style={{ minHeight: 0 }}>
      <Subheader>
        <SubheaderRow lx={{ paddingHorizontal: "s8" }}>
          <SubheaderTitle>{coinToSendLabel}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        {rows.map(row => (
          <ListItem
            key={row.rowKey}
            disabled={row.disabled}
            onPress={
              isCustomPickingStrategy ? () => handleToggle(row.rowKey, row.disabled) : undefined
            }
          >
            <ListItemLeading>
              <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s12", flex: 1 }}>
                {isCustomPickingStrategy ? (
                  <Checkbox
                    checked={!row.excluded}
                    disabled={row.disabled}
                    onCheckedChange={() => handleToggle(row.rowKey, row.disabled)}
                  />
                ) : null}
                <ListItemContent>
                  <ListItemTitle>{row.titleLabel}</ListItemTitle>
                  <ListItemDescription>{row.formattedValue}</ListItemDescription>
                </ListItemContent>
              </Box>
            </ListItemLeading>
            {row.isUsedInTx && !isCustomPickingStrategy && (
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
