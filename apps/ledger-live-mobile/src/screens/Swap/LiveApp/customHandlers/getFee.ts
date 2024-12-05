import { Strategy } from "@ledgerhq/coin-evm/lib/types/index";
import { getMainAccount, getParentAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAbandonSeedAddress } from "@ledgerhq/live-common/currencies/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { Account, AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { SEG_WIT_ABANDON_SEED_ADDRESS } from "../consts";
import {
  convertToAtomicUnit,
  convertToNonAtomicUnit,
  getCustomFeesPerFamily,
  transformToBigNumbers,
} from "../utils";

interface FeeParams {
  fromAccountId: string;
  fromAmount: string;
  feeStrategy: Strategy;
  openDrawer: boolean;
  customFeeConfig: Record<string, unknown>;
  SWAP_VERSION: string;
}

interface FeeData {
  feesStrategy: Strategy;
  estimatedFees: BigNumber | undefined;
  errors: TransactionStatus["errors"];
  warnings: TransactionStatus["warnings"];
  customFeeConfig: Record<string, unknown>;
}

interface GenerateFeeDataParams {
  account: AccountLike;
  feePayingAccount: Account;
  feesStrategy: Strategy;
  fromAmount: BigNumber | undefined;
  customFeeConfig: Record<string, unknown>;
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
}: GenerateFeeDataParams): Promise<FeeData> => {
  const bridge = getAccountBridge(account, feePayingAccount);
  const baseTransaction = bridge.createTransaction(feePayingAccount);

  const recipient = getRecipientAddress(baseTransaction.family, feePayingAccount.currency.id);

  const transactionConfig: Transaction = {
    ...baseTransaction,
    subAccountId: account.type !== "Account" ? account.id : undefined,
    recipient,
    amount: fromAmount ?? new BigNumber(0),
    feesStrategy,
    ...transformToBigNumbers(customFeeConfig),
  };

  const preparedTransaction = await bridge.updateTransaction(feePayingAccount, transactionConfig);
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
  (accounts: AccountLike[]) =>
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

    return generateFeeData({
      account,
      feePayingAccount,
      feesStrategy: params.feeStrategy,
      fromAmount: atomicAmount,
      customFeeConfig: params.customFeeConfig,
    });
  };
