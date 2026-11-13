import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import IconAccountSettings from "~/renderer/icons/AccountSettings";
import IconTrash from "~/renderer/icons/Trash";
import type { XrpFamily } from "./types";
import { getXrpResources, hasTokenStandardEnabled } from "./utils";

const AccountHeaderManageActions: XrpFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  if (account.type !== "TokenAccount" || !parentAccount) return [];
  if (!hasTokenStandardEnabled(parentAccount)) return [];

  const data = { account: parentAccount, tokenAccount: account };
  const disabled = !getXrpResources(account);

  if (account.token.tokenType === "iou") {
    return [
      {
        key: "ManageToken",
        label: t("xrp.manageToken.title"),
        icon: IconAccountSettings,
        accountActionsTestId: "xrp-manage-token",
        disabled,
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
      disabled,
      onClick: () => dispatch(openModal("MODAL_XRP_REMOVE_TOKEN", data)),
    },
  ];
};

export default AccountHeaderManageActions;
