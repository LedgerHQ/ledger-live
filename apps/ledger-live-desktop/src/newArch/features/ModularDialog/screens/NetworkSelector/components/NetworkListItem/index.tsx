import React from "react";
import { ListItem } from "@ledgerhq/lumen-ui-react";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
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
      leadingContent={
        <SquaredCryptoIcon size="48px" ledgerId={currency.id} ticker={currency.ticker} />
      }
      description={description}
      descriptionTag={apy}
      trailingContent={rightElement}
      onClick={onClick}
      data-testid={`network-item-name-${currency.name}`}
      className="-outline-offset-2"
    />
  );
};
