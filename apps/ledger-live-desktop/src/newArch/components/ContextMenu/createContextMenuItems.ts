import { IconsLegacy } from "@ledgerhq/react-ui";
import { openModal } from "~/renderer/actions/modals";
import { CollectibleType, CollectibleTypeEnum } from "../../Collectibles/types/Collectibles";
import { Account } from "@ledgerhq/types-live";
import { Dispatch } from "redux";
import { TFunction } from "i18next";
import { RouteComponentProps } from "react-router-dom";

type Props = {
  account: Account;
  collectionAddress: string;
  collectionName?: string | null;
  goBackToAccount?: boolean;
  typeOfCollectible: CollectibleType;
  dispatch: Dispatch;
  setDrawer: () => void;
  history: RouteComponentProps["history"];
  t: TFunction;
};

export function createContextMenuItems({
  typeOfCollectible,
  collectionName,
  collectionAddress,
  account,
  dispatch,
  setDrawer,
  history,
  goBackToAccount,
  t,
}: Props) {
  if (typeOfCollectible === CollectibleTypeEnum.NFT) {
    return [
      {
        key: "hide",
        label: t("hideNftCollection.hideCTA"),
        Icon: IconsLegacy.NoneMedium,
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
  }
  return [];
}
