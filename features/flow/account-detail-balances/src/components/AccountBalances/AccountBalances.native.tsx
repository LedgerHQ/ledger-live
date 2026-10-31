import React, { useState } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { BalanceCard } from "../../internals/BalanceCard";
import { BalanceInfoSheet } from "../../internals/BalanceInfoSheet";
import type { AccountBalancesProps, BalanceItem } from "./AccountBalances.types";

const CARDS_PER_ROW = 2;

const inRows = (items: readonly BalanceItem[]) =>
  Array.from({ length: Math.ceil(items.length / CARDS_PER_ROW) }, (_, index) =>
    items.slice(index * CARDS_PER_ROW, (index + 1) * CARDS_PER_ROW),
  );

export const AccountBalances = ({ items, discreet = false, testID }: AccountBalancesProps) => {
  const [infoItemId, setInfoItemId] = useState<string>();

  if (items.length === 0) return null;

  return (
    <Box lx={{ gap: "s8" }} testID={testID}>
      {inRows(items).map(row => (
        <Box key={row[0]?.id} lx={{ flexDirection: "row", gap: "s8" }}>
          {Array.from({ length: CARDS_PER_ROW }, (_, index) => {
            const item = row[index];
            return (
              <Box key={item?.id ?? `empty-${index}`} lx={{ flex: 1 }}>
                {item ? (
                  <BalanceCard
                    item={item}
                    discreet={discreet}
                    onShowDescription={setInfoItemId}
                    testID={testID ? `${testID}-${item.id}` : undefined}
                  />
                ) : null}
              </Box>
            );
          })}
        </Box>
      ))}
      <BalanceInfoSheet
        item={items.find(({ id }) => id === infoItemId)}
        onClose={() => setInfoItemId(undefined)}
        testID={testID ? `${testID}-info` : undefined}
      />
    </Box>
  );
};
