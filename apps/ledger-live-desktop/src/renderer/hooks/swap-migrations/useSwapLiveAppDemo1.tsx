import { v4 } from "uuid";
import { useEffect } from "react";

import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import {
  getCustomFeesPerFamily,
  convertToNonAtomicUnit,
} from "@ledgerhq/live-common/exchange/swap/webApp/index";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import { SwapProps, SwapWebManifestIDs } from "~/renderer/screens/exchange/Swap2/Form/SwapWebView";

export type UseSwapLiveAppDemo1Props = {
  isSwapLiveAppEnabled: boolean;
  manifestID: string;
  swapTransaction: SwapTransactionType;
  swapError?: Error;
  updateSwapWebProps: React.Dispatch<React.SetStateAction<Partial<SwapProps> | undefined>>;
};

export const useSwapLiveAppDemo1 = (props: UseSwapLiveAppDemo1Props) => {
  const { isSwapLiveAppEnabled, manifestID, swapTransaction, swapError, updateSwapWebProps } =
    props;

  useEffect(() => {
    if (isSwapLiveAppEnabled && manifestID !== SwapWebManifestIDs.Demo1) {
      const { swap } = swapTransaction;
      const { to, from } = swap;
      const transaction = swapTransaction.transaction;
      const { account: fromAccount, parentAccount: fromParentAccount } = from;
      const { account: toAccount, parentAccount: toParentAccount } = to;
      const { feesStrategy } = transaction || {};

      const fromAccountId =
        fromAccount && accountToWalletAPIAccount(fromAccount, fromParentAccount)?.id;
      const toAccountId = toAccount && accountToWalletAPIAccount(toAccount, toParentAccount)?.id;
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

      updateSwapWebProps({
        cacheKey: v4(),
        fromAccountId,
        toAccountId,
        fromAmount: fromAmount?.toString(),
        fromParentAccountId: fromParentAccount
          ? accountToWalletAPIAccount(fromParentAccount)?.id
          : undefined,
        fromCurrencyId,
        toCurrencyId,
        feeStrategy: (isCustomFee ? "custom" : "medium")?.toUpperCase(),
        customFeeConfig: customFeeConfig ? JSON.stringify(customFeeConfig) : undefined,
        error: !!swapError,
      });
    }
  }, [
    isSwapLiveAppEnabled,
    swapTransaction.swap.from.account?.id,
    swapTransaction.swap.from.currency?.id,
    swapTransaction.swap.to.currency?.id,
    swapTransaction.transaction?.amount,
    swapError,
    swapTransaction.bridgePending,
  ]);
};
