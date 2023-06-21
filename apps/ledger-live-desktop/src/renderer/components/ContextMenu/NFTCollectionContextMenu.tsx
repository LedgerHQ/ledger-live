import React from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { openModal } from "~/renderer/actions/modals";
import ContextMenuItem from "./ContextMenuItem";
import { setDrawer } from "~/renderer/drawers/Provider";
import { Account } from "@ledgerhq/types-live";
import { Icons } from "@ledgerhq/react-ui";
type Props = {
  account: Account;
  collectionAddress: string;
  collectionName?: string;
  children: React.ReactNode;
  leftClick?: boolean;
  goBackToAccount?: boolean;
};
export default function NFTCollectionContextMenu({
  children,
  account,
  collectionAddress,
  collectionName,
  leftClick,
  goBackToAccount = false,
}: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const history = useHistory();
  const menuItems = [
    {
      key: "hide",
      label: t("hideNftCollection.hideCTA"),
      Icon: Icons.NoneMedium,
      callback: () =>
        dispatch(
          openModal("MODAL_HIDE_NFT_COLLECTION", {
            collectionName: collectionName ?? collectionAddress,
            collectionId: `${account.id}|${collectionAddress}`,
            onClose: () => {
              if (goBackToAccount) {
                setDrawer();
                history.replace(`account/${account.id}`);
              }
            },
          }),
        ),
    },
  ];
  return (
    <ContextMenuItem items={menuItems} leftClick={leftClick}>
      {children}
    </ContextMenuItem>
  );
}
