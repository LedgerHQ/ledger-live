import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { ListItem } from "@ledgerhq/ldls-ui-react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export type NetworkListItemData = {
  currency: CryptoOrTokenCurrency;
  description?: string;
  rightElement?: React.ReactNode;
  apy?: React.ReactNode;
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
      title={currency.name}
      leadingContent={
        <CryptoIcon
          size="48px"
          ledgerId={currency.id}
          ticker={currency.ticker}
          overridesRadius="12px"
        />
      }
      description={description}
      descriptionTag={apy ? <>{apy}</> : undefined}
      trailingContent={rightElement}
      onClick={onClick}
      data-testid={`network-item-name-${currency.name}`}
    />
  );
};
