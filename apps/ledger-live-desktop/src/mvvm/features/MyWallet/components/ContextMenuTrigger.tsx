import React from "react";
import { PopoverTrigger } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { UserAvatar } from "./UserAvatar";

export function ContextMenuTrigger() {
  const { t } = useTranslation();
  const label = t("myWallet.title");

  return (
    <PopoverTrigger
      render={
        <button aria-label={label} className="cursor-pointer items-center justify-center">
          <span className="inline-flex">
            <UserAvatar showNotification size="sm" />
          </span>
        </button>
      }
    />
  );
}
