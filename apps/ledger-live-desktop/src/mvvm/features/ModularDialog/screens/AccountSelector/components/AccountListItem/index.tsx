import React from "react";
import {
  ListItem,
  ListItemLeading,
  ListItemTitle,
  ListItemDescription,
  ListItemTrailing,
  ListItemContent,
} from "@ledgerhq/lumen-ui-react";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";

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
    <ListItemContent>
      {fiatValue && <ListItemTitle>{fiatValue}</ListItemTitle>}
      {balance && <ListItemDescription>{balance}</ListItemDescription>}
    </ListItemContent>
  );
};

export const AccountListItem = ({ onClick, account }: AccountListItemProps) => {
  const { name, balance, fiatValue, address, ticker, cryptoId, parentId } = account;
  const formattedAddress = formatAddress(address);

  const networkId = parentId ?? cryptoId;

  return (
    <ListItem className="-outline-offset-2" onClick={onClick} data-testid={`account-row-${name}`}>
      <ListItemLeading>
        <ListItemContent>
          <ListItemTitle>{name}</ListItemTitle>
          <ListItemDescription className="flex gap-6">
            {formattedAddress}
            <SquaredCryptoIcon size="16px" ledgerId={networkId} ticker={ticker} />
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>{renderTrailingContent(balance, fiatValue)}</ListItemTrailing>
    </ListItem>
  );
};
