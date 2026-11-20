import { useTranslation } from "react-i18next";
import { AccountIdSchema } from "@domain/entity-account";
import { useDispatch } from "LLD/hooks/redux";
import IconAccountSettings from "~/renderer/icons/AccountSettings";
import type { XrpFamily } from "./types";
import { getManagedTokenAccounts } from "./utils";
import { openXrpDialog } from "./xrpDialog";

const AccountHeaderManageActions: XrpFamily["accountHeaderManageActions"] = ({ account }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  if (account.type !== "Account") return [];
  if (getManagedTokenAccounts(account).length === 0) return [];

  return [
    {
      key: "ManageAssets",
      label: t("xrp.manageAssets.cta"),
      icon: IconAccountSettings,
      accountActionsTestId: "xrp-manage-assets",
      onClick: () =>
        dispatch(openXrpDialog(AccountIdSchema.parse(account.id), { screen: "manageAssets" })),
    },
  ];
};

export default AccountHeaderManageActions;
