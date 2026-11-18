import { useCallback } from "react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { useGetIssuerFeeQuery } from "@ledgerhq/live-common/families/xrp/state-manager/api";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useLocale, useTranslation } from "~/context/Locale";
import { formatIssuerFee, getManageableTokenAccounts } from "../utils";
import type { XrpManageTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenList>
>;

export function useIssuerFeeText(token: TokenCurrency): string | undefined {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const issuerFee = useGetIssuerFeeQuery(token, { refetchOnReconnect: true });
  if (issuerFee.isError) return t("xrp.manageAssets.transferFeeUnavailable");
  if (!issuerFee.data) return undefined;

  return formatIssuerFee(issuerFee.data, locale);
}

export function useManageTokenViewModel({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);

  const onEdit = useCallback(
    (tokenAccount: XrpTokenAccount) => {
      if (account?.type !== "Account") return;

      navigation.navigate(ScreenName.XrpManageTokenSettings, {
        accountId: tokenAccount.id,
        parentId: account.id,
      });
    },
    [account, navigation],
  );

  if (account?.type !== "Account") {
    return {
      onEdit,
      account: undefined,
      tokenAccounts: [],
    };
  }

  return {
    onEdit,
    account,
    tokenAccounts: getManageableTokenAccounts(account),
  };
}
