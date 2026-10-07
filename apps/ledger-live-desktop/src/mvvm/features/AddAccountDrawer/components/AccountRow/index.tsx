import React from "react";
import {
  Checkbox,
  IconButton,
  ListItem,
  ListItemContent,
  ListItemContentRow,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight, PenEdit } from "@ledgerhq/lumen-ui-react/symbols";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";

export type AccountRowTrailing = "arrow" | "edit" | "checkbox";

export type AccountRowAccount = {
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

type AccountRowProps = {
  account: AccountRowAccount;
  onClick?: () => void;
  trailing?: AccountRowTrailing;
  checked?: boolean;
  onEdit?: () => void;
};

const renderBalance = (balance?: string, fiatValue?: string) => {
  if (!balance && !fiatValue) {
    return null;
  }

  return (
    <ListItemContent>
      {fiatValue ? <ListItemTitle>{fiatValue}</ListItemTitle> : null}
      {balance ? <ListItemDescription>{balance}</ListItemDescription> : null}
    </ListItemContent>
  );
};

export const AccountRow = ({ account, onClick, trailing, checked, onEdit }: AccountRowProps) => {
  const { name, balance, fiatValue, protocol, address, ticker, cryptoId, parentId, id } = account;
  const formattedAddress = formatAddress(address, { prefixLength: 5, suffixLength: 5 });

  return (
    <ListItem
      className="-outline-offset-2"
      onClick={onClick}
      active={trailing === "checkbox" ? Boolean(checked) : undefined}
      data-testid={`account-row-${name}`}
    >
      <ListItemLeading>
        <ListItemContent>
          <ListItemContentRow>
            <ListItemTitle>{name}</ListItemTitle>
            {protocol ? (
              <Tag size="sm" appearance="gray" label={protocol} className="uppercase" />
            ) : null}
          </ListItemContentRow>
          <ListItemDescription className="flex gap-6">
            {formattedAddress}
            {ticker && cryptoId ? (
              <SquaredCryptoIcon size={16} ledgerId={cryptoId} network={parentId} ticker={ticker} />
            ) : null}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing className="gap-12">
        {renderBalance(balance, fiatValue)}
        {trailing === "checkbox" ? (
          <Checkbox
            className="pointer-events-none"
            name={`account-${id}`}
            checked={Boolean(checked)}
            tabIndex={-1}
            data-testid="right-element-checkbox"
          />
        ) : null}
        {trailing === "arrow" ? (
          <ChevronRight size={24} data-testid="right-element-arrow-icon" />
        ) : null}
        {trailing === "edit" ? (
          <div
            onClick={event => event.stopPropagation()}
            onKeyDown={event => event.stopPropagation()}
          >
            <IconButton
              appearance="transparent"
              size="sm"
              icon={PenEdit}
              aria-label="Edit account item"
              data-testid="right-element-edit-icon"
              onClick={onEdit}
            />
          </div>
        ) : null}
      </ListItemTrailing>
    </ListItem>
  );
};
