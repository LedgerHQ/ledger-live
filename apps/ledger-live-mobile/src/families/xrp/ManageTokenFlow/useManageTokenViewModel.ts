import { useCallback, useState } from "react";
import BigNumber from "bignumber.js";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import {
  useGetIssuerFeeQuery,
  useGetNetworkReservesQuery,
} from "@ledgerhq/live-common/families/xrp/state-manager/api";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useLocale } from "~/context/Locale";
import { formatIssuerFee, getManageableTokenAccounts } from "../utils";
import type { XrpManageTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenList>
>;

export function useIssuerFee(token: TokenCurrency) {
  const { locale } = useLocale();
  const issuerFee = useGetIssuerFeeQuery(token, { refetchOnReconnect: true });

  return {
    value: issuerFee.data ? formatIssuerFee(issuerFee.data, locale) : undefined,
    isError: issuerFee.isError,
  };
}

export function useOwnerReserve(currencyId: string) {
  const reserves = useGetNetworkReservesQuery(currencyId, { refetchOnReconnect: true });

  return {
    value: reserves.data ? new BigNumber(reserves.data.increment) : undefined,
    isError: reserves.isError,
  };
}

export function useManageTokenViewModel({ navigation, route }: Props) {
  const { account: screenAccount } = useAccountScreen(route);
  const [deleting, setDeleting] = useState<XrpTokenAccount>();
  const onDeleteDone = useCallback(() => setDeleting(undefined), []);
  const onDeleteSuccess = useCallback(() => navigation.goBack(), [navigation]);

  const onEdit = useCallback(
    (tokenAccount: XrpTokenAccount) => {
      navigation.navigate(ScreenName.XrpManageTokenSettings, {
        accountId: tokenAccount.id,
        parentId: tokenAccount.parentId,
      });
    },
    [navigation],
  );

  const account = screenAccount?.type === "Account" ? screenAccount : undefined;

  return {
    account,
    deleting,
    onDeleteDone,
    onDeleteSuccess,
    tokenAccounts: account ? getManageableTokenAccounts(account) : [],
    onEdit,
    onDelete: setDeleting,
  };
}
