/* eslint-disable no-console */
import { RPCHandler, customWrapper } from "@ledgerhq/wallet-api-server";
import { deserializeTransaction } from "@ledgerhq/wallet-api-core";
import {
  getParentAccount,
  getMainAccount,
  makeEmptyTokenAccount,
  isTokenAccount,
} from "@ledgerhq/coin-framework/account/index";
import { Account, AccountLike, AnyMessage, Operation, SignedOperation } from "@ledgerhq/types-live";
import { getCryptoAssetsStore } from "../../bridge/crypto-assets/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import {
  MessageSignParams,
  MessageSignResult,
  SignOptions,
  TransactionOptions,
  TransactionSignAndBroadcastParams,
  TransactionSignAndBroadcastResult,
  TransactionSignParams,
  TransactionSignResult,
  RegisterYieldBearingEthereumAddressParams,
  RegisterYieldBearingEthereumAddressResult,
} from "@ledgerhq/wallet-api-acre-module";
import { Transaction } from "../../generated/types";
import { AppManifest } from "../types";
import { TrackingAPI } from "./tracking";
import {
  getAccountIdFromWalletAccountId,
  getWalletAPITransactionSignFlowInfos,
} from "../converters";
import { getAccountBridge } from "../../bridge";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";
import BigNumber from "bignumber.js";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

type Handlers = {
  "custom.acre.messageSign": RPCHandler<MessageSignResult, MessageSignParams>;
  "custom.acre.transactionSign": RPCHandler<TransactionSignResult, TransactionSignParams>;
  "custom.acre.transactionSignAndBroadcast": RPCHandler<
    TransactionSignAndBroadcastResult,
    TransactionSignAndBroadcastParams
  >;
  "custom.acre.registerYieldBearingEthereumAddress": RPCHandler<
    RegisterYieldBearingEthereumAddressResult,
    RegisterYieldBearingEthereumAddressParams
  >;
};

export type ACREUiHooks = {
  "custom.acre.messageSign": (params: {
    account: AccountLike;
    message: AnyMessage;
    options?: SignOptions;
    onSuccess: (signature: string) => void;
    onError: (error: Error) => void;
    onCancel: () => void;
  }) => void;
  "custom.acre.transactionSign": (params: {
    account: AccountLike;
    parentAccount: Account | undefined;
    signFlowInfos: {
      canEditFees: boolean;
      hasFeesProvided: boolean;
      liveTx: Partial<Transaction>;
    };
    options?: TransactionOptions;
    onSuccess: (signedOperation: SignedOperation) => void;
    onError: (error: Error) => void;
  }) => void;
  "custom.acre.transactionBroadcast"?: (
    account: AccountLike,
    parentAccount: Account | undefined,
    mainAccount: Account,
    optimisticOperation: Operation,
  ) => void;
  "custom.acre.registerAccount": (params: {
    parentAccount: Account;
    accountName: string;
    existingAccounts: Account[];
    onSuccess: () => void;
    onError: (error: Error) => void;
  }) => void;
};

// Helper function to validate Ethereum address format
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Helper function to validate all inputs before account creation
function validateInputs(params: RegisterYieldBearingEthereumAddressParams): {
  ethereumAddress: string;
  tokenContractAddress?: string;
  tokenTicker?: string;
  meta?: Record<string, unknown>;
} {
  const { ethereumAddress, tokenContractAddress, tokenTicker, meta } = params;

  // Validate Ethereum address format
  if (!ethereumAddress) {
    throw new Error("Ethereum address is required");
  }
  if (!isValidEthereumAddress(ethereumAddress)) {
    throw new Error("Invalid Ethereum address format");
  }

  // Validate that at least one token identifier is provided
  if (!tokenContractAddress && !tokenTicker) {
    throw new Error("Either tokenContractAddress or tokenTicker must be provided");
  }

  return { ethereumAddress, tokenContractAddress, tokenTicker, meta };
}

// Helper function to find acreToken by address or token id
async function findAcreToken(
  tokenContractAddress?: string,
  tokenTicker?: string,
): Promise<{ token: TokenCurrency; contractAddress: string }> {
  let foundToken: TokenCurrency | undefined;
  // Try to find token by contract address first (if provided)
  if (tokenContractAddress) {
    foundToken = await getCryptoAssetsStore().findTokenByAddressInCurrency(
      tokenContractAddress,
      "ethereum",
    );
  } else if (tokenTicker) {
    foundToken = await getCryptoAssetsStore().findTokenById(tokenTicker.toLowerCase());
  }
  if (!foundToken) {
    throw new Error(
      `Token not found. Tried contract address: ${tokenContractAddress || "not provided"}, ticker: ${tokenTicker || "not provided"}`,
    );
  }
  return { token: foundToken, contractAddress: foundToken.contractAddress };
}

// Helper function to generate unique account names with suffixes
// This is clearly a hack as we do not have account name on Account type, we leverage on how many accounts have acreBTC as token sub account to define the name
// This is made to help user to identify different ACRE account but not resilient to token account being wiped, emptied
// (empty subAccount would not been included in the list therefore parent account not considered as an acre account anymore).
function generateUniqueAccountName(
  existingAccounts: Account[],
  baseName: string,
  tokenAddress: string,
): string {
  const existingAccountWithAcreToken = existingAccounts.flatMap(
    account =>
      account.subAccounts?.filter(
        subAccount => subAccount.token.contractAddress.toLowerCase() === tokenAddress.toLowerCase(),
      ) || [],
  );
  return existingAccountWithAcreToken.length > 0
    ? `${baseName} ${existingAccountWithAcreToken.length}`
    : baseName;
}

// Helper function to create parent Ethereum account
function createParentAccount(ethereumAddress: string, ethereumCurrency: CryptoCurrency): Account {
  return {
    type: "Account" as const,
    id: `js:2:ethereum:${ethereumAddress}:`,
    seedIdentifier: `04${ethereumAddress.slice(2)}`,
    derivationMode: "" as any,
    index: 0,
    freshAddress: ethereumAddress,
    freshAddressPath: "44'/60'/0'/0/0",
    used: false,
    blockHeight: 0,
    creationDate: new Date(),
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    currency: ethereumCurrency,
    lastSyncDate: new Date(),
    swapHistory: [],
    balanceHistoryCache: {
      HOUR: { latestDate: Date.now(), balances: [] },
      DAY: { latestDate: Date.now(), balances: [] },
      WEEK: { latestDate: Date.now(), balances: [] },
    },
    syncHash: "0x00000000", // Use proper hash format
    subAccounts: [], // Add empty subAccounts array
    nfts: [],
  };
}

export const handlers = ({
  accounts,
  tracking,
  manifest,
  uiHooks: {
    "custom.acre.messageSign": uiMessageSign,
    "custom.acre.transactionSign": uiTransactionSign,
    "custom.acre.transactionBroadcast": uiTransactionBroadcast,
    "custom.acre.registerAccount": uiRegisterAccount,
  },
}: {
  accounts: AccountLike[];
  tracking: TrackingAPI;
  manifest: AppManifest;
  uiHooks: ACREUiHooks;
}) => {
  async function signTransaction({
    accountId: walletAccountId,
    rawTransaction,
    options,
    tokenCurrency,
  }: TransactionSignParams) {
    const transaction = deserializeTransaction(rawTransaction);

    tracking.signTransactionRequested(manifest);
    if (!transaction) {
      tracking.signTransactionFail(manifest);
      throw new Error("Transaction required");
    }
    const accountId = getAccountIdFromWalletAccountId(walletAccountId);
    if (!accountId) {
      tracking.signTransactionFail(manifest);
      throw new Error(`accountId ${walletAccountId} unknown`);
    }
    const account = accounts.find(account => account.id === accountId);
    if (!account) {
      tracking.signTransactionFail(manifest);
      throw new Error("Account required");
    }

    const parentAccount = getParentAccount(account, accounts);

    const accountFamily = isTokenAccount(account)
      ? account.token.parentCurrency.family
      : account.currency.family;

    const mainAccount = getMainAccount(account, parentAccount);
    const currency = tokenCurrency
      ? await getCryptoAssetsStore().findTokenById(tokenCurrency)
      : null;
    const signerAccount = currency ? makeEmptyTokenAccount(mainAccount, currency) : account;
    const { canEditFees, liveTx, hasFeesProvided } = getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: transaction,
      account,
    });

    if (accountFamily !== liveTx.family) {
      throw new Error(
        `Account and transaction must be from the same family. Account family: ${accountFamily}, Transaction family: ${liveTx.family}`,
      );
    }

    const signFlowInfos = {
      canEditFees,
      liveTx,
      hasFeesProvided,
    };

    return new Promise<SignedOperation>((resolve, reject) => {
      let done = false;
      return uiTransactionSign({
        account: signerAccount,
        parentAccount,
        signFlowInfos,
        options,
        onSuccess: signedOperation => {
          if (done) return;
          done = true;
          tracking.signTransactionSuccess(manifest);
          resolve(signedOperation);
        },
        onError: error => {
          if (done) return;
          done = true;
          tracking.signTransactionFail(manifest);
          reject(error);
        },
      });
    });
  }
  return {
    "custom.acre.messageSign": customWrapper<MessageSignParams, MessageSignResult>(async params => {
      if (!params) {
        tracking.signMessageNoParams(manifest);
        // Maybe return an error instead
        return { hexSignedMessage: "" };
      }

      tracking.signMessageRequested(manifest);

      const { accountId: walletAccountId, derivationPath, message, options } = params;

      const accountId = getAccountIdFromWalletAccountId(walletAccountId);
      if (!accountId) {
        tracking.signMessageFail(manifest);
        throw new Error(`accountId ${walletAccountId} unknown`);
      }

      const account = accounts.find(account => account.id === accountId);
      if (account === undefined) {
        tracking.signMessageFail(manifest);
        throw new Error("account not found");
      }

      const path = fromRelativePath(getMainAccount(account).freshAddressPath, derivationPath);

      const formattedMessage = { ...message, path } as AnyMessage;

      return new Promise((resolve, reject) => {
        let done = false;
        return uiMessageSign({
          account,
          message: formattedMessage,
          options,
          onSuccess: signature => {
            if (done) return;
            done = true;
            tracking.signMessageSuccess(manifest);
            resolve({
              hexSignedMessage: signature.replace("0x", ""),
            });
          },
          onCancel: () => {
            if (done) return;
            done = true;
            tracking.signMessageFail(manifest);
            reject(new UserRefusedOnDevice());
          },
          onError: error => {
            if (done) return;
            done = true;
            tracking.signMessageFail(manifest);
            reject(error instanceof Error ? error : new Error(String(error)));
          },
        });
      });
    }),
    "custom.acre.transactionSign": customWrapper<TransactionSignParams, TransactionSignResult>(
      async params => {
        if (!params) {
          tracking.signTransactionNoParams(manifest);
          // Maybe return an error instead
          return { signedTransactionHex: "" };
        }

        const signedOperation = await signTransaction(params);

        return {
          signedTransactionHex: Buffer.from(signedOperation.signature).toString("hex"),
        };
      },
    ),
    "custom.acre.transactionSignAndBroadcast": customWrapper<
      TransactionSignAndBroadcastParams,
      TransactionSignAndBroadcastResult
    >(async params => {
      if (!params) {
        tracking.signTransactionAndBroadcastNoParams(manifest);
        // Maybe return an error instead
        return { transactionHash: "" };
      }

      const signedOperation = await signTransaction(params);

      if (!signedOperation) {
        tracking.broadcastFail(manifest);
        return Promise.reject(new Error("Transaction required"));
      }

      const { accountId: walletAccountId, tokenCurrency } = params;

      const accountId = getAccountIdFromWalletAccountId(walletAccountId);
      if (!accountId) {
        tracking.broadcastFail(manifest);
        return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
      }

      const account = accounts.find(account => account.id === accountId);
      if (!account) {
        tracking.broadcastFail(manifest);
        return Promise.reject(new Error("Account required"));
      }

      const currency = tokenCurrency
        ? await getCryptoAssetsStore().findTokenById(tokenCurrency)
        : null;
      const parentAccount = getParentAccount(account, accounts);
      const mainAccount = getMainAccount(account, parentAccount);
      const signerAccount = currency ? makeEmptyTokenAccount(mainAccount, currency) : account;

      const bridge = getAccountBridge(signerAccount, parentAccount);
      const broadcastAccount = getMainAccount(signerAccount, parentAccount);

      let optimisticOperation: Operation = signedOperation.operation;
      if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
        try {
          optimisticOperation = await bridge.broadcast({
            account: broadcastAccount,
            signedOperation,
          });
          tracking.broadcastSuccess(manifest);
        } catch (error) {
          tracking.broadcastFail(manifest);
          throw error;
        }
      }
      uiTransactionBroadcast &&
        uiTransactionBroadcast(account, parentAccount, mainAccount, optimisticOperation);
      return {
        transactionHash: optimisticOperation.hash,
      };
    }),
    "custom.acre.registerYieldBearingEthereumAddress": customWrapper<
      RegisterYieldBearingEthereumAddressParams,
      RegisterYieldBearingEthereumAddressResult
    >(async params => {
      if (!params) {
        return Promise.reject(new Error("Parameters required"));
      }
      const validatedInputs = validateInputs(params);
      const ethereumCurrency = getCryptoCurrencyById("ethereum");
      const { token: existingToken, contractAddress: finalTokenContractAddress } =
        await findAcreToken(validatedInputs.tokenContractAddress, validatedInputs.tokenTicker);
      const existingBearingAccount = accounts.find(
        account =>
          "freshAddress" in account &&
          (account as any).freshAddress === validatedInputs.ethereumAddress,
      );
      const baseName = "Yield-bearing BTC on ACRE";
      // Account already added, skip registration.
      if (existingBearingAccount) {
        return {
          success: true,
          accountName: baseName,
          parentAccountId: existingBearingAccount.id,
          tokenAccountId: existingBearingAccount.id,
          ethereumAddress: validatedInputs.ethereumAddress,
          tokenContractAddress: finalTokenContractAddress,
          meta: validatedInputs.meta,
        };
      }

      if (uiRegisterAccount) {
        // Create account & manage the case where an ACRE account has been already registered on another Ethereum address
        // Filter to have only root accounts
        const existingParentAccounts = accounts.filter(
          (acc): acc is Account => acc.type === "Account",
        );
        const accountName = generateUniqueAccountName(
          existingParentAccounts,
          baseName,
          finalTokenContractAddress,
        );
        const parentAccount = createParentAccount(
          validatedInputs.ethereumAddress,
          ethereumCurrency,
        );
        const tokenAccount = makeEmptyTokenAccount(parentAccount, existingToken);
        // Add token account as sub-account of parent account
        const parentAccountWithSubAccount = {
          ...parentAccount,
          subAccounts: [tokenAccount],
        };

        return new Promise((resolve, reject) => {
          uiRegisterAccount({
            parentAccount: parentAccountWithSubAccount,
            accountName,
            existingAccounts: existingParentAccounts,
            onSuccess: () => {
              resolve({
                success: true,
                accountName,
                parentAccountId: parentAccountWithSubAccount.id,
                tokenAccountId: tokenAccount.id,
                ethereumAddress: validatedInputs.ethereumAddress,
                tokenContractAddress: finalTokenContractAddress,
                meta: validatedInputs.meta,
              });
            },
            onError: error => {
              reject(error);
            },
          });
        });
      } else {
        throw new Error("No account registration UI hook available");
      }
    }),
  } as const satisfies Handlers;
};
function fromRelativePath(basePath: string, derivationPath?: string) {
  if (!derivationPath) {
    return basePath;
  }
  const splitPath = basePath.split("'/");
  splitPath[splitPath.length - 1] = derivationPath;
  return splitPath.join("'/");
}
