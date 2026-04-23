import React from "react";
import { PopoverTrigger, Tooltip, TooltipTrigger, TooltipContent } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { UserAvatar } from "./UserAvatar";

type ContextMenuTriggerProps = Readonly<{
  popoverOpen: boolean;
}>;

export function ContextMenuTrigger({ popoverOpen }: ContextMenuTriggerProps) {
  const { t } = useTranslation();
  const label = t("myWallet.title");

  return (
    <PopoverTrigger
      render={
        <button
          aria-label={label}
          className="cursor-pointer items-center justify-center rounded-full hover:bg-muted-hover"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <UserAvatar showNotification />
              </span>
            </TooltipTrigger>
            {!popoverOpen && <TooltipContent side="bottom">{label}</TooltipContent>}
          </Tooltip>
        </button>
      }
    />
  );
}
