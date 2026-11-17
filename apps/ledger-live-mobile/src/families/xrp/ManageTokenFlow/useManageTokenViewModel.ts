import { useQuery } from "@tanstack/react-query";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getIssuerFeeForToken } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useLocale, useTranslation } from "~/context/Locale";
import { formatIssuerFee, getManageableTokenAccounts } from "../utils";
import type { XrpManageTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenManage>
>;

export function useIssuerFeeText(token: TokenCurrency): string | undefined {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const issuerFee = useQuery({
    queryKey: ["xrpIssuerFee", token.id],
    queryFn: () => getIssuerFeeForToken(token),
    retry: false,
  });
  if (issuerFee.isError) return t("xrp.manageAssets.transferFeeUnavailable");
  if (!issuerFee.data) return undefined;

  return formatIssuerFee(issuerFee.data, locale);
}

export function useManageTokenViewModel(props: Props) {
  const { account } = useAccountScreen(props.route);
  if (account?.type !== "Account") return { account: undefined, tokenAccounts: [] };

  return { account, tokenAccounts: getManageableTokenAccounts(account) };
}
