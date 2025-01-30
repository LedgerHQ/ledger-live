import { Strategy } from "@ledgerhq/coin-evm/lib/types/index";
import { getMainAccount, getParentAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAbandonSeedAddress } from "@ledgerhq/live-common/currencies/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { Account, AccountBridge, AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { SEG_WIT_ABANDON_SEED_ADDRESS } from "../consts";

import { getGasTracker } from "@ledgerhq/coin-evm/api/gasTracker/index";
import { NavigationProp, NavigationState } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { convertToAtomicUnit, convertToNonAtomicUnit, getCustomFeesPerFamily } from "../utils";

interface FeeParams {
  fromAccountId: string;
  fromAmount: string;
  feeStrategy: Strategy;
  openDrawer: boolean;
  customFeeConfig: object;
  SWAP_VERSION: string;
}

export interface FeeData {
  feesStrategy: Strategy;
  estimatedFees: BigNumber | undefined;
  errors: TransactionStatus["errors"];
  warnings: TransactionStatus["warnings"];
  customFeeConfig: object;
}

interface GenerateFeeDataParams {
  account: AccountLike;
  feePayingAccount: Account;
  feesStrategy: Strategy;
  fromAmount: BigNumber | undefined;
  customFeeConfig: object;
  bridge: AccountBridge<Transaction>;
  baseTransaction: Transaction;
}

const getRecipientAddress = (
  transactionFamily: Transaction["family"],
  currencyId: string,
): string => {
  switch (transactionFamily) {
    case "evm":
      return getAbandonSeedAddress(currencyId);
    case "bitcoin":
      return SEG_WIT_ABANDON_SEED_ADDRESS;
    default:
      throw new Error(`Unsupported transaction family: ${transactionFamily}`);
  }
};

const generateFeeData = async ({
  account,
  feePayingAccount,
  feesStrategy = "medium",
  fromAmount,
  customFeeConfig,
  bridge,
  baseTransaction,
}: GenerateFeeDataParams): Promise<FeeData> => {
  const gasTracker = getGasTracker(feePayingAccount.currency);

  const gasOptions = await gasTracker?.getGasOptions({ currency: feePayingAccount.currency });
  const gasOption = gasOptions ? gasOptions[feesStrategy] : undefined;

  const config = baseTransaction.family === "evm" ? gasOption : customFeeConfig;

  const recipient = getRecipientAddress(baseTransaction.family, feePayingAccount.currency.id);
  const transactionConfig: Transaction = {
    ...baseTransaction,
    subAccountId: account.type !== "Account" ? account.id : undefined,
    recipient,
    amount: fromAmount ?? new BigNumber(0),
    feesStrategy,
    ...config,
  };

  const preparedTransaction = bridge.updateTransaction(baseTransaction, transactionConfig);

  const transactionStatus = await bridge.getTransactionStatus(
    feePayingAccount,
    preparedTransaction,
  );

  return {
    feesStrategy,
    estimatedFees: convertToNonAtomicUnit({
      amount: transactionStatus.estimatedFees,
      account: feePayingAccount,
    }),
    errors: transactionStatus.errors,
    warnings: transactionStatus.warnings,
    customFeeConfig: getCustomFeesPerFamily(preparedTransaction),
  };
};

export const getFee =
  (
    accounts: AccountLike[],
    navigation: Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & {
      getState(): NavigationState | undefined;
    },
  ) =>
  async ({ params }: { params: FeeParams }): Promise<FeeData> => {
    const accountId = getAccountIdFromWalletAccountId(params.fromAccountId);
    if (!accountId) {
      throw new Error(`Invalid wallet account ID: ${params.fromAccountId}`);
    }

    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const parentAccount =
      account.type === "TokenAccount" ? getParentAccount(account, accounts) : undefined;

    const feePayingAccount = getMainAccount(account, parentAccount);

    const amount = new BigNumber(params.fromAmount);
    const atomicAmount = convertToAtomicUnit({ amount, account });

    const bridge = getAccountBridge(account, feePayingAccount);
    const baseTransaction = bridge.createTransaction(feePayingAccount);

    if (params.openDrawer) {
      return new Promise(resolve => {
        navigation.navigate(NavigatorName.Fees, {
          screen: ScreenName.FeeHomePage,
          params: {
            onSelect: async (feesStrategy, customFeeConfig) => {
              const newFeeData = await generateFeeData({
                account,
                feePayingAccount,
                feesStrategy,
                fromAmount: atomicAmount,
                customFeeConfig,
                bridge,
                baseTransaction,
              });
              resolve(newFeeData);
              navigation.canGoBack() && navigation.goBack();
            },
            account,
            feePayingAccount,
            fromAmount: amount,
            feesStrategy: params.feeStrategy,
            customFeeConfig: params.customFeeConfig,
            transaction: baseTransaction,
          },
        });
      });
    }

    return await generateFeeData({
      account,
      feePayingAccount,
      feesStrategy: params.feeStrategy,
      fromAmount: atomicAmount,
      customFeeConfig: params.customFeeConfig,
      bridge,
      baseTransaction,
    });
  };
