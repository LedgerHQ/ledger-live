import { getAbandonSeedAddress } from "@ledgerhq/live-common/currencies/index";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import BigNumber from "bignumber.js";

import { SEG_WIT_ABANDON_SEED_ADDRESS } from "../consts";

import { getMainAccount, getParentAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Account, AccountLike } from "@ledgerhq/types-live";
import {
  convertToAtomicUnit,
  convertToNonAtomicUnit,
  getCustomFeesPerFamily,
  transformToBigNumbers,
} from "../utils";

interface FeeParams {
  fromAccountId: string;
  fromAmount: string;
  feeStrategy: string;
  openDrawer: boolean;
  customFeeConfig: Record<string, unknown>;
  SWAP_VERSION: string;
}

interface FeeResult {
  feesStrategy: string;
  estimatedFees: BigNumber | undefined;
  errors: Record<string, unknown>;
  warnings: Record<string, unknown>;
  customFeeConfig: Record<string, unknown>;
}

// Constants
const SUPPORTED_CUSTOM_FEE_FAMILIES: Transaction["family"][] = ["bitcoin", "evm"];
const DEFAULT_FEE_STRATEGY = "medium";

// Helper functions
const getRecipientAddress = (currencyId: string): string => {
  return currencyId === "bitcoin"
    ? SEG_WIT_ABANDON_SEED_ADDRESS
    : getAbandonSeedAddress(currencyId);
};

const convertAmount = (params: { amount: BigNumber; account: Account }): BigNumber | undefined => {
  return convertToAtomicUnit(params);
};

// const trackFeeSelection = (params: {
//   save: boolean;
//   swapVersion: string;
//   feeStrategy: string;
// }): void => {
//   track("button_clicked2", {
//     button: params.save ? "continueNetworkFees" : "closeNetworkFees",
//     page: "quoteSwap",
//     ...SWAP_TRACKING_PROPERTIES,
//     swapVersion: params.swapVersion,
//     value: params.feeStrategy || "custom",
//   });
// };

export const getFee =
  (accounts: AccountLike[]) =>
  async ({ params }: { params: FeeParams }): Promise<FeeResult> => {
    // Account validation
    const realFromAccountId = getAccountIdFromWalletAccountId(params.fromAccountId);
    if (!realFromAccountId) {
      throw new Error(`accountId ${params.fromAccountId} unknown`);
    }

    const fromAccount = accounts.find(acc => acc.id === realFromAccountId);
    if (!fromAccount) {
      throw new Error(`accountId ${params.fromAccountId} unknown`);
    }

    // Account setup
    const fromParentAccount = getParentAccount(fromAccount, accounts);
    const mainAccount = getMainAccount(fromAccount, fromParentAccount);
    const bridge = getAccountBridge(fromAccount, fromParentAccount);
    const subAccountId = fromAccount.type !== "Account" ? fromAccount.id : undefined;

    // Initialize transaction
    const baseTransaction = bridge.createTransaction(mainAccount);
    const preparedTransaction = await bridge.prepareTransaction(mainAccount, {
      ...baseTransaction,
      subAccountId,
      recipient: getRecipientAddress(mainAccount.currency.id),
      amount: convertAmount({
        amount: new BigNumber(params.fromAmount),
        account: fromParentAccount,
      }),
      feesStrategy: params.feeStrategy || DEFAULT_FEE_STRATEGY,
      ...transformToBigNumbers(params.customFeeConfig),
    });

    // Get initial status
    const initialStatus = await bridge.getTransactionStatus(mainAccount, preparedTransaction);
    const currentStatus = initialStatus;
    const currentTransaction = preparedTransaction;
    const customFeeConfig = baseTransaction && getCustomFeesPerFamily(currentTransaction);

    // Handle non-drawer case
    if (!params.openDrawer) {
      return formatFeeResult({
        transaction: currentTransaction,
        status: currentStatus,
        mainAccount,
        customFeeConfig,
      });
    }

    // Handle drawer case
    return new Promise<FeeResult>(resolve => {
      // const handleDrawerClose = async (save: boolean) => {
      //   trackFeeSelection({
      //     save,
      //     swapVersion: params.SWAP_VERSION,
      //     feeStrategy: currentTransaction.feesStrategy,
      //   });
      //   const result = formatFeeResult({
      //     transaction: save ? currentTransaction : preparedTransaction,
      //     status: save ? currentStatus : initialStatus,
      //     mainAccount,
      //     customFeeConfig,
      //   });
      //   // setDrawer(undefined);
      //   resolve(result);
      // };
      // const updateTransaction = async (newTransaction: Transaction): Promise<Transaction> => {
      //   currentStatus = await bridge.getTransactionStatus(mainAccount, newTransaction);
      //   customFeeConfig = baseTransaction && getCustomFeesPerFamily(newTransaction);
      //   currentTransaction = newTransaction;
      //   return newTransaction;
      // };
      // setDrawer(
      //   FeesDrawerLiveApp,
      //   {
      //     setTransaction: updateTransaction,
      //     account: fromAccount,
      //     parentAccount: fromParentAccount,
      //     status: currentStatus,
      //     provider: undefined,
      //     disableSlowStrategy: true,
      //     transaction: preparedTransaction,
      //     onRequestClose: handleDrawerClose,
      //   },
      //   {
      //     title: t("swap2.form.details.label.fees"),
      //     forceDisableFocusTrap: true,
      //     onRequestClose: () => handleDrawerClose(false),
      //   },
      // );

      return resolve(
        formatFeeResult({
          transaction: currentTransaction,
          status: currentStatus,
          mainAccount,
          customFeeConfig,
        }),
      );
    });
  };

// Helper function to format the final result
const formatFeeResult = ({
  transaction,
  status,
  mainAccount,
  customFeeConfig,
}: {
  transaction: Transaction;
  status: TransactionStatus;
  mainAccount: Account;
  customFeeConfig: Record<string, unknown>;
}): FeeResult => ({
  feesStrategy: transaction.feesStrategy || "custom",
  estimatedFees: convertToNonAtomicUnit({
    amount: status.estimatedFees,
    account: mainAccount,
  }),
  errors: status.errors,
  warnings: status.warnings,
  customFeeConfig: SUPPORTED_CUSTOM_FEE_FAMILIES.includes(transaction.family)
    ? { hasDrawer: true, ...customFeeConfig }
    : {},
});
