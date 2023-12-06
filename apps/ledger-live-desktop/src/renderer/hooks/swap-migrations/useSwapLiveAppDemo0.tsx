import { v4 } from "uuid";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import {
  getCustomFeesPerFamily,
  convertToNonAtomicUnit,
} from "@ledgerhq/live-common/exchange/swap/webApp/index";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { SwapProps, SwapWebManifestIDs } from "~/renderer/screens/exchange/Swap2/Form/SwapWebView";
import { rateSelector } from "~/renderer/actions/swap";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";

export type UseSwapLiveAppDemo0Props = {
  isSwapLiveAppEnabled: boolean;
  manifestID: string;
  swapTransaction: SwapTransactionType;
  swapError?: Error;
  updateSwapWebProps: React.Dispatch<React.SetStateAction<Partial<SwapProps> | undefined>>;
};

export const useSwapLiveAppDemo0 = (props: UseSwapLiveAppDemo0Props) => {
  const { isSwapLiveAppEnabled, manifestID, swapTransaction, swapError, updateSwapWebProps } =
    props;
  const totalListedAccounts = useSelector(flattenAccountsSelector);
  const exchangeRate = useSelector(rateSelector);
  const walletApiPartnerList = useFeature("swapWalletApiPartnerList");

  const provider = exchangeRate?.provider;
  const exchangeRatesState = swapTransaction.swap?.rates;

  useEffect(() => {
    if (isSwapLiveAppEnabled && manifestID !== SwapWebManifestIDs.Demo0) {
      const { swap } = swapTransaction;
      const { to, from } = swap;
      const transaction = swapTransaction.transaction;
      const { account: fromAccount, parentAccount: fromParentAccount } = from;
      const { account: toAccount, parentAccount: toParentAccount } = to;
      const { feesStrategy } = transaction || {};
      const { rate, rateId } = exchangeRate || {};

      const isToAccountValid = totalListedAccounts.some(account => account.id === toAccount?.id);
      const fromAccountId =
        fromAccount && accountToWalletAPIAccount(fromAccount, fromParentAccount)?.id;
      const toAccountId = isToAccountValid
        ? toAccount && accountToWalletAPIAccount(toAccount, toParentAccount)?.id
        : toParentAccount && accountToWalletAPIAccount(toParentAccount, undefined)?.id;
      const toNewTokenId =
        !isToAccountValid && toAccount?.type === "TokenAccount" ? toAccount.token?.id : undefined;
      const fromAmount =
        fromAccount &&
        convertToNonAtomicUnit({
          amount: transaction?.amount,
          account: fromAccount,
        });

      // Currency ids
      const fromCurrencyId = swapTransaction.swap.from.currency?.id;
      const toCurrencyId = swapTransaction.swap.to.currency?.id;

      const customFeeConfig = transaction && getCustomFeesPerFamily(transaction);
      // The Swap web app will automatically recreate the transaction with "default" fees.
      // However, if you wish to use a different fee type, you will need to set it as custom.
      const isCustomFee =
        feesStrategy === "slow" || feesStrategy === "fast" || feesStrategy === "custom";

      const providerRedirectFromAccountId =
        fromAccount &&
        provider &&
        walletApiPartnerList?.enabled &&
        walletApiPartnerList?.params?.list.includes(provider)
          ? accountToWalletAPIAccount(fromAccount, fromParentAccount)?.id
          : fromAccount?.id;

      const providerRedirectURLSearch = new URLSearchParams();
      providerRedirectFromAccountId &&
        providerRedirectURLSearch.set("accountId", providerRedirectFromAccountId);

      exchangeRate?.providerURL &&
        providerRedirectURLSearch.set("customDappUrl", exchangeRate.providerURL);
      providerRedirectURLSearch.set("returnTo", "/swap");

      updateSwapWebProps({
        provider,
        fromAccountId,
        toAccountId,
        fromAmount: fromAmount?.toString(),
        fromParentAccountId: fromParentAccount
          ? accountToWalletAPIAccount(fromParentAccount)?.id
          : undefined,
        fromCurrencyId,
        toCurrencyId,
        quoteId: rateId ? rateId : undefined,
        rate: rate?.toString(),
        feeStrategy: (isCustomFee ? "custom" : "medium")?.toUpperCase(),
        customFeeConfig: customFeeConfig ? JSON.stringify(customFeeConfig) : undefined,
        cacheKey: v4(),
        error: !!swapError,
        loading: swapTransaction.bridgePending || exchangeRatesState.status === "loading",
        providerRedirectURL: `ledgerlive://discover/${getProviderName(
          provider ?? "",
        ).toLowerCase()}?${providerRedirectURLSearch.toString()}`,
        toNewTokenId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isSwapLiveAppEnabled,
    provider,
    swapTransaction.swap.from.account?.id,
    swapTransaction.swap.from.currency?.id,
    swapTransaction.swap.to.currency?.id,
    swapTransaction.swap.to.account?.id,
    exchangeRate?.providerType,
    exchangeRate?.tradeMethod,
    swapError,
    swapTransaction.bridgePending,
    exchangeRatesState.status,
    exchangeRate?.providerURL,
  ]);
};
