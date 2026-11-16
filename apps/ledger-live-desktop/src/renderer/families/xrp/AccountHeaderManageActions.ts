import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import IconAccountSettings from "~/renderer/icons/AccountSettings";
import IconTrash from "~/renderer/icons/Trash";
import type { XrpFamily } from "./types";
import { openManageAssets } from "./ManageAssetsDialog/manageAssetsDialog";
import {
  getManagedTokenAccounts,
  getRemoveAvailability,
  getXrpResources,
  hasTokenStandardEnabled,
} from "./utils";

const AccountHeaderManageActions: XrpFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  if (account.type === "Account") {
    if (!hasTokenStandardEnabled(account)) return [];
    if (getManagedTokenAccounts(account).length === 0) return [];

    return [
      {
        key: "ManageAssets",
        label: t("xrp.manageAssets.title"),
        icon: IconAccountSettings,
        accountActionsTestId: "xrp-manage-assets",
        onClick: () => dispatch(openManageAssets()),
      },
    ];
  }

  if (!parentAccount) return [];
  if (!hasTokenStandardEnabled(parentAccount)) return [];

  const data = { account: parentAccount, tokenAccount: account };

  if (account.token.tokenType === "iou") {
    return [
      {
        key: "ManageToken",
        label: t("xrp.manageToken.title"),
        icon: IconAccountSettings,
        accountActionsTestId: "xrp-manage-token",
        disabled: !getXrpResources(account),
        onClick: () => dispatch(openModal("MODAL_XRP_MANAGE_TOKEN", data)),
      },
    ];
  }

  return [
    {
      key: "RemoveToken",
      label: t("xrp.removeToken.title"),
      icon: IconTrash,
      accountActionsTestId: "xrp-remove-token",
      ...getRemoveAvailability(account, parentAccount, t),
      onClick: () => dispatch(openModal("MODAL_XRP_ADD_TOKEN", { ...data, remove: true })),
    },
  ];
};

export default AccountHeaderManageActions;
