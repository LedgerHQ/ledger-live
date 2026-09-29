import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import type { CardAssetRow as CardAssetRowModel } from "./types";

const ICON_SIZE = 48;
const COUNTERVALUE_PLACEHOLDER = "\u00a0";

export function CardAssetRow({
  row,
  onPress,
}: Readonly<{ row: CardAssetRowModel; onPress: (row: CardAssetRowModel) => void }>) {
  return (
    <ListItem
      testID={`card-asset-${row.id}`}
      lx={{ backgroundColor: "surface", borderRadius: "md" }}
      onPress={() => onPress(row)}
    >
      <ListItemLeading>
        <CryptoIcon ledgerId={row.ledgerId} ticker={row.ticker} size={ICON_SIZE} shape="circle" />
        <ListItemContent>
          <ListItemTitle>{row.name}</ListItemTitle>
          <ListItemDescription>{row.ticker}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent lx={{ alignItems: "flex-end" }}>
          <ListItemTitle testID={`card-asset-countervalue-${row.id}`}>
            {row.countervalue ?? COUNTERVALUE_PLACEHOLDER}
          </ListItemTitle>
          <ListItemDescription>{row.cryptoAmount}</ListItemDescription>
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
}
