import React from "react";
import { IconButton, Tooltip, TooltipTrigger, TooltipContent } from "@ledgerhq/lumen-ui-react";
import { PenEdit } from "@ledgerhq/lumen-ui-react/symbols";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { useTranslation } from "react-i18next";
import { EditName } from "../../EditName";

type AccountRowActionCellProps = {
  readonly account: AccountLike;
  readonly editNameAriaLabel: string;
  readonly isSyncing: boolean;
};

export function AccountRowActionCell({
  account,
  editNameAriaLabel,
  isSyncing,
}: AccountRowActionCellProps) {
  const { t } = useTranslation();
  const currency = getAccountCurrency(account);

  return (
    <div className="flex justify-end" onClick={e => e.stopPropagation()}>
      {isSyncing ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <IconButton
                appearance="transparent"
                size="sm"
                icon={PenEdit}
                aria-label={editNameAriaLabel}
                disabled
              />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t("cryptoAddresses.editName.syncingTooltip")}
          </TooltipContent>
        </Tooltip>
      ) : (
        <EditName account={account} asset={currency.name}>
          <IconButton
            appearance="transparent"
            size="sm"
            icon={PenEdit}
            aria-label={editNameAriaLabel}
          />
        </EditName>
      )}
    </div>
  );
}
