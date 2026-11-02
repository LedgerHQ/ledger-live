import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronDown } from "@ledgerhq/lumen-ui-rnative/symbols";

type PerpsAccountSelectorProps = Readonly<{
  title: string;
  ticker: string;
  ledgerId: string;
  description: string;
  hasError: boolean;
  onSelect: () => void;
  testID: string;
}>;

export function PerpsAccountSelector({
  title,
  ticker,
  ledgerId,
  description,
  hasError,
  onSelect,
  testID,
}: PerpsAccountSelectorProps) {
  return (
    <ListItem
      onPress={onSelect}
      lx={{ backgroundColor: "surface", borderRadius: "md" }}
      testID={testID}
    >
      <ListItemLeading>
        <CryptoIcon size={32} ledgerId={ledgerId} ticker={ticker} />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription lx={{ color: hasError ? "error" : "muted" }}>
            {description}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ChevronDown size={24} />
      </ListItemTrailing>
    </ListItem>
  );
}
