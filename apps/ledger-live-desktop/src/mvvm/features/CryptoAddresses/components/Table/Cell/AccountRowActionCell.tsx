import React from "react";
import { IconButton, Tooltip, TooltipTrigger, TooltipContent } from "@ledgerhq/lumen-ui-react";
import type { IconButtonProps } from "@ledgerhq/lumen-ui-react";
import type { AccountLike } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";

type AccountRowActionCellProps = {
  readonly account: AccountLike;
  readonly icon: IconButtonProps["icon"];
  readonly ariaLabel: string;
  readonly isSyncing: boolean;
  readonly onAction: (account: AccountLike) => void;
};

export function AccountRowActionCell({
  account,
  icon,
  ariaLabel,
  isSyncing,
  onAction,
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
                icon={icon}
                aria-label={ariaLabel}
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
          icon={icon}
          aria-label={ariaLabel}
          onClick={() => onAction(account)}
        />
      )}
    </div>
  );
}
