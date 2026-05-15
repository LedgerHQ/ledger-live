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
  /** Optional inline node rendered after the title — typically a small Tag/Badge. */
  titleDecoration?: React.ReactNode;
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

export const AccountListItem = ({ onClick, account, titleDecoration }: AccountListItemProps) => {
  const { name, balance, fiatValue, address, ticker, cryptoId, parentId } = account;
  const formattedAddress = formatAddress(address);

  const networkId = parentId ?? cryptoId;

  return (
    <ListItem className="-outline-offset-2" onClick={onClick} data-testid={`account-row-${name}`}>
      <ListItemLeading>
        <ListItemContent>
          {titleDecoration ? (
            <div className="flex items-center gap-6">
              <ListItemTitle>{name}</ListItemTitle>
              {titleDecoration}
            </div>
          ) : (
            <ListItemTitle>{name}</ListItemTitle>
          )}
          <ListItemDescription className="flex gap-6">
            {formattedAddress}
            {ticker && networkId && (
              <SquaredCryptoIcon size={16} ledgerId={networkId} ticker={ticker} />
            )}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>{renderTrailingContent(balance, fiatValue)}</ListItemTrailing>
    </ListItem>
  );
};
