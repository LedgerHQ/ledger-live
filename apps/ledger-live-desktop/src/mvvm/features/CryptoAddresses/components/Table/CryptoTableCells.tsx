import React from "react";
import { IconButton, TableCellContent } from "@ledgerhq/lumen-ui-react";
import { PenEdit } from "@ledgerhq/lumen-ui-react/symbols";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import { CounterValueCell } from "LLD/features/Assets/components/Cells/CounterValueCell";
import { EditName } from "../EditName";

type AccountNameCellProps = {
  readonly account: AccountLike;
  readonly displayName: string;
};

export function AccountNameCell({ account, displayName }: AccountNameCellProps) {
  const currency = getAccountCurrency(account);
  return (
    <TableCellContent
      leadingContent={<CryptoCurrencyIcon currency={currency} size={32} />}
      title={displayName}
      description={currency.ticker}
    />
  );
}

type AccountAddressCellProps = {
  readonly account: AccountLike;
  readonly lookupParentAccount: (id: string) => Account | undefined | null;
};

export function AccountAddressCell({ account, lookupParentAccount }: AccountAddressCellProps) {
  const address =
    account.type === "Account"
      ? account.freshAddress
      : lookupParentAccount(account.parentId)?.freshAddress ?? "";
  const formatted = formatAddress(address, { prefixLength: 5, suffixLength: 5 });
  return <TableCellContent title={formatted} />;
}

export function AccountValueCell({ account }: { readonly account: AccountLike }) {
  const currency = getAccountCurrency(account);
  const balance = account.balance.toNumber();
  return <CounterValueCell currency={currency} balance={balance} />;
}

type AccountRowActionCellProps = {
  readonly account: AccountLike;
  readonly editNameAriaLabel: string;
};

export function AccountRowActionCell({ account, editNameAriaLabel }: AccountRowActionCellProps) {
  const currency = getAccountCurrency(account);
  return (
    <div className="flex justify-end">
      <EditName account={account} asset={currency.name}>
        <IconButton size="sm" icon={PenEdit} aria-label={editNameAriaLabel} />
      </EditName>
    </div>
  );
}
