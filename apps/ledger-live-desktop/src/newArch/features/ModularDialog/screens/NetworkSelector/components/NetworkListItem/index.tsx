import React from "react";
import { CryptoIcon } from "@ledgerhq/react-ui/pre-ldls";
import { ListItem } from "@ledgerhq/ldls-ui-react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export type Network = CryptoOrTokenCurrency & {
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
};

type NetworkListItemProps = Network & {
  onClick: () => void;
};

export const NetworkListItem = ({
  name,
  ticker,
  id,
  onClick,
  leftElement,
  rightElement,
}: NetworkListItemProps) => {
  const leadingContent = <CryptoIcon size="48px" ledgerId={id} ticker={ticker} />;

  const getTrailingContent = () => {
    if (!leftElement && !rightElement) {
      return undefined;
    }

    return (
      <>
        {leftElement}
        {rightElement}
      </>
    );
  };

  return (
    <ListItem
      title={name}
      leadingContent={leadingContent}
      trailingContent={getTrailingContent()}
      onClick={onClick}
      data-testid={`network-item-name-${name}`}
    />
  );
};
