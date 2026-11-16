import { IconsLegacy } from "@ledgerhq/native-ui";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import type { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { NavigatorName, ScreenName } from "~/const";
import { i18n } from "~/context/Locale";

function getMainActions({
  account,
  parentAccount,
}: {
  account: AccountLike;
  parentAccount?: Account | null;
}): ActionButtonEvent[] {
  if (account.type !== "TokenAccount" || !parentAccount) return [];
  if (account.token.tokenType !== "iou") return [];
  if (!getXrpEnabledTokenStandards(parentAccount.currency.id).includes("iou")) return [];

  return [
    {
      id: "manage_token",
      label: i18n.t("xrp.manageToken.cta"),
      Icon: IconsLegacy.SettingsMedium,
      event: "button_clicked",
      testId: "account-quick-action-button-manage-token",
      eventProperties: {
        button: "manage_token",
        currency: "XRP",
        page: "Account Page",
      },
      navigationParams: [
        NavigatorName.XrpManageTokenFlow,
        {
          screen: ScreenName.XrpManageTokenManage,
          params: { accountId: account.id, parentId: parentAccount.id },
        },
      ] satisfies NavigationParamsType,
    },
  ];
}

export default {
  getMainActions,
};
