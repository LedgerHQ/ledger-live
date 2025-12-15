import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { ListItem } from "@ledgerhq/lumen-ui-react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export type NetworkListItemData = {
  currency: CryptoOrTokenCurrency;
  description?: string;
  rightElement?: React.ReactNode;
  apy?: React.ReactElement;
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
      leadingContent={<CryptoIcon size="48px" ledgerId={currency.id} ticker={currency.ticker} />}
      description={description}
      descriptionTag={apy}
      trailingContent={rightElement}
      onClick={onClick}
      data-testid={`network-item-name-${currency.name}`}
    />
  );
};
