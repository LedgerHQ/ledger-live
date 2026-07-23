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
  SubheaderInfo,
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
  onInfoPress: () => void;
  hasAmount: boolean;
}>;

export const UtxoSelector = ({
  utxoDisplayData,
  coinToSendLabel,
  isCustomPickingStrategy,
  onToggleUtxoExclusion,
  onInfoPress,
  hasAmount,
}: UtxoSelectorProps) => {
  const rows = utxoDisplayData?.utxoRows ?? [];

  const handleToggle = React.useCallback(
    (rowKey: string, disabled: boolean) => {
      if (!isCustomPickingStrategy || disabled || !hasAmount) return;
      onToggleUtxoExclusion?.(rowKey);
    },
    [isCustomPickingStrategy, onToggleUtxoExclusion, hasAmount],
  );

  return (
    <Box lx={{ flexDirection: "column", gap: "s8", flex: 1 }} style={{ minHeight: 0 }}>
      <Subheader>
        <SubheaderRow lx={{ paddingHorizontal: "s8" }}>
          <SubheaderTitle>{coinToSendLabel}</SubheaderTitle>
          <SubheaderInfo onPress={onInfoPress} />
        </SubheaderRow>
      </Subheader>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        {rows.map(row => {
          const rowDisabled = row.disabled || !hasAmount;
          return (
            <ListItem
              key={row.rowKey}
              disabled={rowDisabled}
              onPress={
                isCustomPickingStrategy && !rowDisabled
                  ? () => handleToggle(row.rowKey, rowDisabled)
                  : undefined
              }
            >
              <ListItemLeading>
                <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s12", flex: 1 }}>
                  {isCustomPickingStrategy ? (
                    <Checkbox
                      checked={!row.excluded}
                      disabled={rowDisabled}
                      onCheckedChange={
                        !rowDisabled ? () => handleToggle(row.rowKey, rowDisabled) : undefined
                      }
                    />
                  ) : null}
                  <ListItemContent>
                    <ListItemTitle>{row.titleLabel}</ListItemTitle>
                    <ListItemDescription>{row.formattedValue}</ListItemDescription>
                  </ListItemContent>
                </Box>
              </ListItemLeading>
              {row.isUsedInTx && !isCustomPickingStrategy && !rowDisabled && (
                <ListItemTrailing>
                  <Check />
                </ListItemTrailing>
              )}
            </ListItem>
          );
        })}
      </ScrollView>
    </Box>
  );
};
