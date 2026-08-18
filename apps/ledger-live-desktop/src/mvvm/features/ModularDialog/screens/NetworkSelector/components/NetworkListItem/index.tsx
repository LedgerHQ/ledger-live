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
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { ReactElement, ReactNode } from "react";

export type NetworkListItemData = {
  currency: CryptoOrTokenCurrency;
  description?: string;
  rightElement?: ReactNode;
  apy?: ReactElement;
};

type NetworkListItemProps = NetworkListItemData & {
  onClick: () => void;
  disabled?: boolean;
};

export const NetworkListItem = ({
  currency,
  description,
  rightElement,
  apy,
  onClick,
  disabled,
}: NetworkListItemProps) => {
  return (
    <ListItem
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      data-testid={`network-item-name-${currency.name}`}
      className="-outline-offset-2"
    >
      <ListItemLeading>
        <SquaredCryptoIcon size={48} ledgerId={currency.id} ticker={currency.ticker} />
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
