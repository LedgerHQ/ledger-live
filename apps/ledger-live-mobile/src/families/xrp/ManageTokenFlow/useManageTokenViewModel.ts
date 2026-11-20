import { useCallback, useState } from "react";
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
  const { account: screenAccount } = useAccountScreen(route);
  const [deleting, setDeleting] = useState<XrpTokenAccount>();
  const onDeleteDone = useCallback(() => setDeleting(undefined), []);
  const onDeleteSuccess = useCallback(() => navigation.goBack(), [navigation]);

  const account = screenAccount?.type === "Account" ? screenAccount : undefined;

  return {
    account,
    deleting,
    onDeleteDone,
    onDeleteSuccess,
    tokenAccounts: account ? getManageableTokenAccounts(account) : [],
    onDelete: setDeleting,
  };
}
