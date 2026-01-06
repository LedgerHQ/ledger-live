import React from "react";
import { ListItem } from "@ledgerhq/lumen-ui-react";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import { formatAddress } from "../../../../components/Address/formatAddress";

export type Account = {
  address: string;
  balance?: string;
  cryptoId?: string;
  fiatValue?: string;
  id: string;
  name: string;
  parentId?: string;
  protocol?: string;
  ticker?: string;
};

export type AccountListItemProps = {
  onClick?: () => void;
  account: Account;
};

const renderTrailingContent = (balance?: string, fiatValue?: string) => {
  if (!balance && !fiatValue) {
    return undefined;
  }

  return (
    <div className="flex flex-col items-end">
      {fiatValue && <span className="body-2-semi-bold">{fiatValue}</span>}
      {balance && <span className="text-muted body-3">{balance}</span>}
    </div>
  );
};

export const AccountListItem = ({ onClick, account }: AccountListItemProps) => {
  const { name, balance, fiatValue, address, ticker, cryptoId, parentId } = account;
  const formattedAddress = formatAddress(address);

  const networkId = parentId ?? cryptoId;

  return (
    <ListItem
      title={name}
      description={formattedAddress}
      descriptionTag={<SquaredCryptoIcon size="16px" ledgerId={networkId} ticker={ticker} />}
      trailingContent={renderTrailingContent(balance, fiatValue)}
      onClick={onClick}
      data-testid={`account-row-${name}`}
      className="-outline-offset-2"
    />
  );
};
