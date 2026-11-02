import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { BalanceCard } from "../../internals/BalanceCard";
import { BalanceInfoSheet } from "../../internals/BalanceInfoSheet";
import type { AccountBalanceSummaryViewModel } from "./useAccountBalanceSummaryViewModel";

export const AccountBalanceSummaryView = ({
  rows,
  cardsPerRow,
  discreet,
  infoItem,
  onShowDescription,
  onCloseInfo,
  testID,
}: AccountBalanceSummaryViewModel) => {
  if (rows.length === 0) return null;

  return (
    <Box lx={{ gap: "s8" }} testID={testID}>
      {rows.map(row => (
        <Box key={row[0]?.id} lx={{ flexDirection: "row", gap: "s8" }}>
          {Array.from({ length: cardsPerRow }, (_, index) => {
            const item = row[index];
            return (
              <Box key={item?.id ?? `empty-${index}`} lx={{ flex: 1 }}>
                {item ? (
                  <BalanceCard
                    item={item}
                    discreet={discreet}
                    onShowDescription={onShowDescription}
                    testID={testID ? `${testID}-${item.id}` : undefined}
                  />
                ) : null}
              </Box>
            );
          })}
        </Box>
      ))}
      <BalanceInfoSheet
        item={infoItem}
        onClose={onCloseInfo}
        testID={testID ? `${testID}-info` : undefined}
      />
    </Box>
  );
};
