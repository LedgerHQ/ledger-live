import { Strategy } from "@ledgerhq/coin-evm/lib/types/index";
import { getMainAccount, getParentAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAbandonSeedAddress } from "@ledgerhq/live-common/currencies/index";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

import { convertToAtomicUnit, convertToNonAtomicUnit, getCustomFeesPerFamily } from "../utils";
const getSegWitAbandonSeedAddress = (): string => "bc1qed3mqr92zvq2s782aqkyx785u23723w02qfrgs";

type TransformableObject = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export function transformToBigNumbers(obj: TransformableObject): TransformableObject {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const transformedObj: TransformableObject = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === "string" && !isNaN(value as unknown as number)) {
        transformedObj[key] = new BigNumber(value);
      } else if (typeof value === "object") {
        transformedObj[key] = transformToBigNumbers(value);
      } else {
        transformedObj[key] = value;
      }
    }
  }

  return transformedObj;
}

interface FeeParams {
  fromAccountId: string;
  fromAmount: string;
  feeStrategy: Strategy;
  openDrawer: boolean;
  customFeeConfig: object;
  SWAP_VERSION: string;
  gasLimit?: string;
}

export interface FeeData {
  feesStrategy: Strategy;
  estimatedFees: BigNumber | undefined;
  errors: TransactionStatus["errors"];
  warnings: TransactionStatus["warnings"];
  customFeeConfig: object;
  hasDrawer: boolean;
  gasLimit: BigNumber | null;
}

export const getFee =
  (accounts: AccountLike[]) =>
  async ({ params }: { params: FeeParams }): Promise<FeeData> => {
    const realFromAccountId = getAccountIdFromWalletAccountId(params.fromAccountId);
    if (!realFromAccountId) {
      return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
    }

    const fromAccount = accounts.find(acc => acc.id === realFromAccountId);
    if (!fromAccount) {
      return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
    }
    const fromParentAccount = getParentAccount(fromAccount, accounts);

    const mainAccount = getMainAccount(fromAccount, fromParentAccount);
    const bridge = getAccountBridge(fromAccount, fromParentAccount);

    const subAccountId = fromAccount.type !== "Account" && fromAccount.id;
    const transaction = bridge.createTransaction(mainAccount);

    const preparedTransaction = await bridge.prepareTransaction(mainAccount, {
      ...transaction,
      subAccountId,
      recipient:
        mainAccount.currency.id === "bitcoin"
          ? getSegWitAbandonSeedAddress()
          : getAbandonSeedAddress(mainAccount.currency.id),
      amount: convertToAtomicUnit({
        amount: new BigNumber(params.fromAmount),
        account: fromAccount,
      }),
      feesStrategy: params.feeStrategy || "medium",
      customGasLimit: params.gasLimit ? new BigNumber(params.gasLimit) : null,
      ...transformToBigNumbers(params.customFeeConfig),
    });
    const status = await bridge.getTransactionStatus(mainAccount, preparedTransaction);
    const finalTx = preparedTransaction;
    const customFeeConfig = transaction && getCustomFeesPerFamily(finalTx);

    // filters out the custom fee config for chains without drawer
    const hasDrawer = ["evm", "bitcoin"].includes(transaction.family);
    if (!params.openDrawer) {
      return {
        feesStrategy: finalTx.feesStrategy,
        estimatedFees: convertToNonAtomicUnit({
          amount: status.estimatedFees,
          account: mainAccount,
        }),
        errors: status.errors,
        warnings: status.warnings,
        customFeeConfig,
        hasDrawer,
        gasLimit: finalTx.gasLimit,
      };
    }

    return {
      feesStrategy: finalTx.feesStrategy,
      estimatedFees: convertToNonAtomicUnit({
        amount: status.estimatedFees,
        account: mainAccount,
      }),
      errors: status.errors,
      warnings: status.warnings,
      customFeeConfig,
      hasDrawer,
      gasLimit: finalTx.gasLimit,
    };
  };
