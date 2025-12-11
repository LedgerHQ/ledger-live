import React from "react";
import { CryptoIcon, Tag } from "@ledgerhq/react-ui/pre-ldls";
import { ListItem } from "@ledgerhq/ldls-ui-react";
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
  showIcon?: boolean;
};

const renderDescriptionTag = (protocol?: string) => {
  if (!protocol) {
    return undefined;
  }

  return <Tag textTransform="uppercase">{protocol}</Tag>;
};

const renderTrailingContent = (balance?: string, fiatValue?: string) => {
  if (!balance && !fiatValue) {
    return undefined;
  }

  return (
    <div className="flex flex-col items-end">
      {fiatValue && <span className="body-3">{fiatValue}</span>}
      {balance && <span className="body-4 text-muted">{balance}</span>}
    </div>
  );
};

export const AccountListItem = ({ onClick, account, showIcon = true }: AccountListItemProps) => {
  const { name, balance, fiatValue, protocol, address, ticker, cryptoId, parentId } = account;
  const formattedAddress = formatAddress(address);

  return (
    <ListItem
      title={name}
      leadingContent={
        showIcon ? (
          <CryptoIcon size="48px" ledgerId={cryptoId} network={parentId} ticker={ticker} />
        ) : undefined
      }
      description={formattedAddress}
      descriptionTag={renderDescriptionTag(protocol)}
      trailingContent={renderTrailingContent(balance, fiatValue)}
      onClick={onClick}
      data-testid={`account-row-${name}`}
    />
  );
};
