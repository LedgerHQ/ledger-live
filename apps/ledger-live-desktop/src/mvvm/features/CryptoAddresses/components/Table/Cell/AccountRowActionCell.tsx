import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import { PenEdit } from "@ledgerhq/lumen-ui-react/symbols";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { EditName } from "../../EditName";

type AccountRowActionCellProps = {
  readonly account: AccountLike;
  readonly editNameAriaLabel: string;
};

export function AccountRowActionCell({ account, editNameAriaLabel }: AccountRowActionCellProps) {
  const currency = getAccountCurrency(account);
  return (
    <div className="flex justify-end">
      <EditName account={account} asset={currency.name}>
        <IconButton
          appearance="transparent"
          size="sm"
          icon={PenEdit}
          aria-label={editNameAriaLabel}
        />
      </EditName>
    </div>
  );
}
