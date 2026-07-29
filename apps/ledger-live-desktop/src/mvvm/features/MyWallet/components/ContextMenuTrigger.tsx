import React from "react";
import { PopoverTrigger, type PopoverTriggerProps } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { UserAvatar } from "./UserAvatar";

type TriggerRenderProps = Parameters<
  Extract<PopoverTriggerProps["render"], (...args: never[]) => unknown>
>[0];

export function ContextMenuTrigger() {
  const { t } = useTranslation();
  const label = t("myWallet.title");

  return (
    <PopoverTrigger
      render={(props: TriggerRenderProps) => (
        <UserAvatar interactive showNotification size="sm" aria-label={label} {...props} />
      )}
    />
  );
}
