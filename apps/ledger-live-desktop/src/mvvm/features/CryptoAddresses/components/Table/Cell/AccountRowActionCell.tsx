import React from "react";
import { IconButton, Tooltip, TooltipTrigger, TooltipContent } from "@ledgerhq/lumen-ui-react";
import { PenEdit } from "@ledgerhq/lumen-ui-react/symbols";
import type { AccountLike } from "@ledgerhq/types-live";
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

  return (
    // Hover-reveal: the pen is hidden until the user hovers the account
    // row — appearing INSTANTLY (no fade transition). `[tr:hover_&]`
    // scopes the reveal to the ancestor `<tr>`'s hover without touching
    // the generic table components (Lumen's TableRow ships no `group`
    // class). `focus-within` keeps the button reachable for keyboard
    // users — tabbing onto it shows it.
    <div
      className="flex justify-end opacity-0 [tr:hover_&]:opacity-100 focus-within:opacity-100"
      onClick={e => e.stopPropagation()}
    >
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
        // Nested-trigger composition: EditName's DialogTrigger (asChild)
        // slots onto TooltipTrigger (asChild), which slots onto the
        // IconButton — so the single button both opens the dialog and
        // carries the hover tooltip.
        <Tooltip>
          <EditName account={account}>
            <TooltipTrigger asChild>
              <IconButton
                appearance="transparent"
                size="sm"
                icon={PenEdit}
                aria-label={editNameAriaLabel}
              />
            </TooltipTrigger>
          </EditName>
          <TooltipContent side="top">
            {t("cryptoAddresses.editName.tooltip")}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
