import React from "react";
import {
  ListItem,
  ListItemTitle,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { ReactElement, ReactNode } from "react";

export type NetworkListItemData = {
  currency: CryptoOrTokenCurrency;
  description?: string;
  rightElement?: ReactNode;
  apy?: ReactElement;
};

type NetworkListItemProps = NetworkListItemData & {
  onClick: () => void;
};

export const NetworkListItem = ({
  currency,
  description,
  rightElement,
  apy,
  onClick,
}: NetworkListItemProps) => {
  return (
    <ListItem
      onClick={onClick}
      data-testid={`network-item-name-${currency.name}`}
      className="-outline-offset-2"
    >
      <ListItemLeading>
        <SquaredCryptoIcon size="48px" ledgerId={currency.id} ticker={currency.ticker} />
        <ListItemContent>
          <ListItemTitle>{currency.name}</ListItemTitle>
          <ListItemDescription className="flex gap-6">
            {description}
            {apy}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>{rightElement}</ListItemTrailing>
    </ListItem>
  );
};
