import React from "react";
import { IconButton, Tooltip, TooltipTrigger, TooltipContent } from "@ledgerhq/lumen-ui-react";
import { PenEdit } from "@ledgerhq/lumen-ui-react/symbols";
import type { AccountLike } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";

type AccountRowActionCellProps = {
  readonly account: AccountLike;
  readonly editNameAriaLabel: string;
  readonly isSyncing: boolean;
  readonly onEditName: (account: AccountLike) => void;
};

export function AccountRowActionCell({
  account,
  editNameAriaLabel,
  isSyncing,
  onEditName,
}: AccountRowActionCellProps) {
  const { t } = useTranslation();

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
        <IconButton
          appearance="transparent"
          size="sm"
          icon={PenEdit}
          aria-label={editNameAriaLabel}
          onClick={() => onEditName(account)}
        />
      )}
    </div>
  );
}
