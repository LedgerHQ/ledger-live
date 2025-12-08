import React from "react";
import { CryptoIcon } from "@ledgerhq/react-ui/pre-ldls";
import { ListItem } from "@ledgerhq/ldls-ui-react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export type NetworkListItemData = {
  currency: CryptoOrTokenCurrency;
  description?: string;
  rightElement?: React.ReactNode;
};

type NetworkListItemProps = NetworkListItemData & {
  onClick: () => void;
};

export const NetworkListItem = ({
  currency,
  description,
  rightElement,
  onClick,
}: NetworkListItemProps) => {
  return (
    <ListItem
      title={currency.name}
      leadingContent={<CryptoIcon size="48px" ledgerId={currency.id} ticker={currency.ticker} />}
      description={description}
      trailingContent={rightElement}
      onClick={onClick}
      data-testid={`network-item-name-${currency.name}`}
    />
  );
};
