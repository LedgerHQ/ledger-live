import React from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Icons } from "@ledgerhq/react-ui";
import { Ordinal } from "../types/Ordinals";
import { openURL } from "~/renderer/linking";
import { ContextMenuItemType } from "~/renderer/components/ContextMenu/ContextMenuWrapper";

export default (ordinal: Ordinal) => {
  const { t } = useTranslation();

  const menuItems = useMemo(() => {
    const items: ContextMenuItemType[] = [
      {
        id: "explorer",
        label: t("account.ordinals.contextMenu.viewer", {
          viewer: "Magic Eden",
        }),
        Icon: () => <Icons.Globe size={"XS"} />,
        type: "external",
        callback: () =>
          openURL(
            `https://magiceden.io/ordinals/item-details/${ordinal.metadata.ordinal_details?.inscription_id}`,
          ),
      },
      {
        id: "explorer",
        label: t("account.ordinals.contextMenu.viewer", {
          viewer: "Explorer",
        }),
        Icon: () => <Icons.Globe size={"XS"} />,
        type: "external",
        callback: () =>
          openURL(
            `https://ordinals.com/inscription/${ordinal.metadata.ordinal_details?.inscription_id}`,
          ),
      },
    ];

    return items;
  }, [ordinal.metadata.ordinal_details?.inscription_id, t]);

  return { menuItems };
};
