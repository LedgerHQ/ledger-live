import { reduce, firstValueFrom } from "rxjs";
import { Strategy } from "@ledgerhq/coin-evm/types";
import { getMainAccount, getParentAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import {
  parseSwapFeeParams,
  transformToBigNumbers,
} from "@ledgerhq/live-common/wallet-api/Exchange/swapParams";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { NavigatorName, ScreenName } from "~/const";
import { NavigationType } from ".";
import { convertToAtomicUnit, convertToNonAtomicUnit, getCustomFeesPerFamily } from "../utils";

// Constants
const CHAINS_WITH_FEE_DRAWER = ["evm"];

// Types
export interface FeeParams {
  fromAccountId: string;
  fromAmount?: string;
  feeStrategy: Strategy;
  openDrawer: boolean;
  customFeeConfig: Record<string, unknown>;
  SWAP_VERSION: string;
  gasLimit?: string;
  data?: string;
  recipient?: string;
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
 * Main function to get fee data for a transaction
 */
export const getFee =
  (
    accounts: AccountLike[],
    navigation: Pick<NavigationType, "navigate" | "canGoBack" | "goBack">,
  ) =>
  async ({ params }: { params: FeeParams }): Promise<FeeData> => {
    const { fromAmount, gasLimit: customGasLimit } = parseSwapFeeParams(params);

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
    let mainAccount = getMainAccount(fromAccount, fromParentAccount);
    const bridge = await getAccountBridge(fromAccount, fromParentAccount);

    if (mainAccount.currency.id === "bitcoin") {
      try {
        const syncedAccount = await firstValueFrom(
          bridge
            .sync(mainAccount, { paginationConfig: {} })
            .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), mainAccount)),
        );

        if (syncedAccount) {
          mainAccount = syncedAccount;
        }
      } catch (e) {
        log("swap", "Error syncing account", e);
      }
    }

    // Create and prepare transaction
    const subAccountId = fromAccount.type !== "Account" && fromAccount.id;
    const transaction = bridge.createTransaction(mainAccount);

    const preparedTransaction = await bridge.prepareTransaction(mainAccount, {
      ...transaction,
      subAccountId,
      recipient: params.recipient || bridge.getEstimationRecipient(mainAccount),
      amount: convertToAtomicUnit({
        amount: fromAmount,
        account: fromAccount,
      }),
      data: (params.data && Buffer.from(params.data.replace("0x", ""), "hex")) || undefined,
      feesStrategy: params.feeStrategy || "medium",
      customGasLimit,
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
            fromAmount,
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
