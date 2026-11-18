import { IconsLegacy } from "@ledgerhq/native-ui";
import type { AccountLike } from "@ledgerhq/types-live";
import type { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { NavigatorName, ScreenName } from "~/const";
import { i18n } from "~/context/Locale";
import { getManageableTokenAccounts } from "./utils";

function getMainActions({ account }: { account: AccountLike }): ActionButtonEvent[] {
  if (account.type !== "Account") return [];
  if (getManageableTokenAccounts(account).length === 0) return [];

  return [
    {
      id: "manage_token",
      label: i18n.t("xrp.manageAssets.cta"),
      Icon: IconsLegacy.SettingsMedium,
      testId: "account-quick-action-button-manage-token",
      eventProperties: {
        button: "manage_token",
        currency: "XRP",
        page: "Account Page",
      },
      navigationParams: [
        NavigatorName.XrpManageTokenFlow,
        {
          screen: ScreenName.XrpManageTokenList,
          params: { accountId: account.id },
        },
      ] satisfies NavigationParamsType,
    },
  ];
}

export default {
  getMainActions,
};
