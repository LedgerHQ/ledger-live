import React from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import ContextMenuItem from "./Item";
import { setDrawer } from "~/renderer/drawers/Provider";
import { Account } from "@ledgerhq/types-live";
import { CollectibleType } from "../../Collectibles/types/Collectibles";
import { createContextMenuItems } from "./createContextMenuItems";

type Props = {
  account: Account;
  collectionAddress: string;
  collectionName?: string | null;
  children: React.ReactNode;
  leftClick?: boolean;
  goBackToAccount?: boolean;
  typeOfCollectible: CollectibleType;
};

export default function CollectionContextMenu({
  children,
  account,
  collectionAddress,
  collectionName,
  leftClick,
  goBackToAccount = false,
  typeOfCollectible,
}: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const history = useHistory();

  const menuItems = createContextMenuItems({
    typeOfCollectible,
    collectionName,
    collectionAddress,
    account,
    dispatch,
    setDrawer,
    history,
    goBackToAccount,
    t,
  });

  return (
    <ContextMenuItem items={menuItems} leftClick={leftClick}>
      {children}
    </ContextMenuItem>
  );
}
