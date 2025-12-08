import React from "react";
import { CryptoIcon } from "@ledgerhq/react-ui/pre-ldls";
import { ListItem } from "@ledgerhq/ldls-ui-react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export type Network = CryptoOrTokenCurrency & {
  rightElement?: React.ReactNode;
  description?: string;
};

type NetworkListItemProps = Network & {
  onClick: () => void;
};

export const NetworkListItem = ({
  name,
  ticker,
  id,
  onClick,
  rightElement,
  description,
}: NetworkListItemProps) => {
  return (
    <ListItem
      title={name}
      leadingContent={<CryptoIcon size="48px" ledgerId={id} ticker={ticker} />}
      description={description}
      trailingContent={rightElement}
      onClick={onClick}
      data-testid={`network-item-name-${name}`}
    />
  );
};
