import { Strategy } from "@ledgerhq/coin-evm/lib/types/index";
import { getMainAccount, getParentAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAbandonSeedAddress } from "@ledgerhq/live-common/currencies/index";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { NavigatorName, ScreenName } from "~/const";
import { NavigationType } from ".";
import { convertToAtomicUnit, convertToNonAtomicUnit, getCustomFeesPerFamily } from "../utils";

// Constants
const CHAINS_WITH_FEE_DRAWER = ["evm"];
const getSegWitAbandonSeedAddress = (): string => "bc1qed3mqr92zvq2s782aqkyx785u23723w02qfrgs";

// Types
type TransformableObject = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export interface FeeParams {
  fromAccountId: string;
  fromAmount: string;
  feeStrategy: Strategy;
  openDrawer: boolean;
  customFeeConfig: Record<string, unknown>;
  SWAP_VERSION: string;
  gasLimit?: string;
}

export interface FeeData {
  feesStrategy: Strategy;
  estimatedFees: BigNumber | undefined;
  errors: TransactionStatus["errors"];
  warnings: TransactionStatus["warnings"];
  customFeeConfig: Record<string, unknown>;
  hasDrawer: boolean;
  gasLimit: BigNumber | null;
}

// Helper functions
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

/**
 * Creates a fee data object from transaction status and other parameters
 */
function createFeeData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  finalTx: any,
  status: TransactionStatus,
  customFeeConfig: Record<string, unknown>,
  hasDrawer: boolean,
  mainAccount: AccountLike,
): FeeData {
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

/**
 * Gets the appropriate recipient address based on currency
 */
function getRecipientAddress(currencyId: string): string {
  return currencyId === "bitcoin"
    ? getSegWitAbandonSeedAddress()
    : getAbandonSeedAddress(currencyId);
}

/**
 * Main function to get fee data for a transaction
 */
export const getFee =
  (accounts: AccountLike[], navigation: NavigationType) =>
  async ({ params }: { params: FeeParams }): Promise<FeeData> => {
    // Validate and find account
    const realFromAccountId = getAccountIdFromWalletAccountId(params.fromAccountId);
    if (!realFromAccountId) {
      return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
    }

    const fromAccount = accounts.find(acc => acc.id === realFromAccountId);
    if (!fromAccount) {
      return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
    }

    // Setup accounts and bridge
    const fromParentAccount = getParentAccount(fromAccount, accounts);
    const mainAccount = getMainAccount(fromAccount, fromParentAccount);
    const bridge = getAccountBridge(fromAccount, fromParentAccount);

    // Create and prepare transaction
    const subAccountId = fromAccount.type !== "Account" && fromAccount.id;
    const transaction = bridge.createTransaction(mainAccount);

    const preparedTransaction = await bridge.prepareTransaction(mainAccount, {
      ...transaction,
      subAccountId,
      recipient: getRecipientAddress(mainAccount.currency.id),
      amount: convertToAtomicUnit({
        amount: new BigNumber(params.fromAmount),
        account: fromAccount,
      }),
      feesStrategy: params.feeStrategy || "medium",
      customGasLimit: params.gasLimit ? new BigNumber(params.gasLimit) : null,
      ...transformToBigNumbers(params.customFeeConfig),
    });

    // Get transaction status and fee config
    const status = await bridge.getTransactionStatus(mainAccount, preparedTransaction);
    const finalTx = preparedTransaction;
    const customFeeConfig = transaction && getCustomFeesPerFamily(finalTx);

    // Check if chain supports fee drawer
    const hasDrawer =
      CHAINS_WITH_FEE_DRAWER.includes(transaction.family) &&
      !["optimism", "arbitrum", "base"].includes(mainAccount.currency.id);

    // Handle fee drawer navigation if requested
    if (params.openDrawer) {
      return new Promise(resolve => {
        navigation.navigate(NavigatorName.Fees, {
          screen: ScreenName.FeeHomePage,
          params: {
            onSelect: async (feesStrategy, customFeeConfig) => {
              const newFeeData = {
                // little hack to make sure we do not return null (for bitcoin for instance)
                feesStrategy: feesStrategy || finalTx.feesStrategy || "custom",
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

              resolve(newFeeData as FeeData);
              navigation.canGoBack() && navigation.goBack();
            },
            account: fromAccount,
            feePayingAccount: mainAccount,
            fromAmount: new BigNumber(params.fromAmount),
            feesStrategy: params.feeStrategy,
            customFeeConfig: params.customFeeConfig,
            transaction: transaction,
          },
        });
      });
    }

    // Return fee data directly if drawer not requested
    return createFeeData(finalTx, status, customFeeConfig, hasDrawer, mainAccount);
  };
