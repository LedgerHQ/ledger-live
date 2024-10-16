import { Account, AccountLike, AnyMessage, SignedOperation } from "@ledgerhq/types-live";
import {
  accountToWalletAPIAccount,
  getWalletAPITransactionSignFlowInfos,
  getAccountIdFromWalletAccountId,
} from "./converters";
import type { TrackingAPI } from "./tracking";
import { AppManifest, TranslatableString, WalletAPITransaction } from "./types";
import {
  isTokenAccount,
  isAccount,
  getMainAccount,
  makeEmptyTokenAccount,
  getParentAccount,
} from "../account/index";
import { Transaction } from "../generated/types";
import { prepareMessageToSign } from "../hw/signMessage/index";
import { getAccountBridge } from "../bridge";
import { Exchange } from "../exchange/types";
import { findTokenById } from "@ledgerhq/cryptoassets";
import { WalletState } from "@ledgerhq/live-wallet/store";
import { getWalletAccount } from "@ledgerhq/coin-bitcoin/wallet-btc/index";

export function translateContent(content: string | TranslatableString, locale = "en"): string {
  if (!content || typeof content === "string") return content;
  return content[locale] || content.en;
}

export type WalletAPIContext = {
  manifest: AppManifest;
  accounts: AccountLike[];
  tracking: TrackingAPI;
};

export function receiveOnAccountLogic(
  walletState: WalletState,
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | undefined,
    accountAddress: string,
  ) => Promise<string>,
  tokenCurrency?: string,
): Promise<string> {
  tracking.receiveRequested(manifest);

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.receiveFail(manifest);
    return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
  }

  const account = accounts.find(account => account.id === accountId);

  if (!account) {
    tracking.receiveFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  const parentAccount = getParentAccount(account, accounts);
  const mainAccount = getMainAccount(account, parentAccount);
  const currency = tokenCurrency ? findTokenById(tokenCurrency) : null;
  const receivingAccount = currency ? makeEmptyTokenAccount(mainAccount, currency) : account;
  const accountAddress = accountToWalletAPIAccount(walletState, account, parentAccount).address;
  return uiNavigation(receivingAccount, parentAccount, accountAddress);
}

export function signTransactionLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  transaction: WalletAPITransaction,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | undefined,
    signFlowInfos: {
      canEditFees: boolean;
      hasFeesProvided: boolean;
      liveTx: Partial<Transaction>;
    },
  ) => Promise<SignedOperation>,
  tokenCurrency?: string,
): Promise<SignedOperation> {
  tracking.signTransactionRequested(manifest);

  if (!transaction) {
    tracking.signTransactionFail(manifest);
    return Promise.reject(new Error("Transaction required"));
  }

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.signTransactionFail(manifest);
    return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
  }

  const account = accounts.find(account => account.id === accountId);

  if (!account) {
    tracking.signTransactionFail(manifest);
    return Promise.reject(new Error("Account required"));
  }

  const parentAccount = getParentAccount(account, accounts);

  const accountFamily = isTokenAccount(account)
    ? parentAccount?.currency.family
    : account.currency.family;

  const mainAccount = getMainAccount(account, parentAccount);
  const currency = tokenCurrency ? findTokenById(tokenCurrency) : null;
  const signerAccount = currency ? makeEmptyTokenAccount(mainAccount, currency) : account;

  const { canEditFees, liveTx, hasFeesProvided } = getWalletAPITransactionSignFlowInfos({
    walletApiTransaction: transaction,
    account: mainAccount,
  });

  if (accountFamily !== liveTx.family) {
    return Promise.reject(
      new Error(
        `Account and transaction must be from the same family. Account family: ${accountFamily}, Transaction family: ${liveTx.family}`,
      ),
    );
  }

  return uiNavigation(signerAccount, parentAccount, {
    canEditFees,
    liveTx,
    hasFeesProvided,
  });
}

export function broadcastTransactionLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  signedOperation: SignedOperation,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | undefined,
    signedOperation: SignedOperation,
  ) => Promise<string>,
  tokenCurrency?: string,
): Promise<string> {
  if (!signedOperation) {
    tracking.broadcastFail(manifest);
    return Promise.reject(new Error("Transaction required"));
  }

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

  const currency = tokenCurrency ? findTokenById(tokenCurrency) : null;
  const parentAccount = getParentAccount(account, accounts);
  const mainAccount = getMainAccount(account, parentAccount);
  const signerAccount = currency ? makeEmptyTokenAccount(mainAccount, currency) : account;

  return uiNavigation(signerAccount, parentAccount, signedOperation);
}

export function signMessageLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  message: string,
  uiNavigation: (account: AccountLike, message: AnyMessage) => Promise<Buffer>,
): Promise<Buffer> {
  tracking.signMessageRequested(manifest);

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.signMessageFail(manifest);
    return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
  }

  const account = accounts.find(account => account.id === accountId);
  if (account === undefined) {
    tracking.signMessageFail(manifest);
    return Promise.reject(new Error("account not found"));
  }

  let formattedMessage: AnyMessage;
  try {
    if (isAccount(account)) {
      formattedMessage = prepareMessageToSign(account, message);
    } else {
      throw new Error("account provided should be the main one");
    }
  } catch (error) {
    tracking.signMessageFail(manifest);
    return Promise.reject(error);
  }

  return uiNavigation(account, formattedMessage);
}

export const bitcoinFamilyAccountGetAddressLogic = (
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  derivationPath?: string,
): Promise<string> => {
  tracking.bitcoinFamilyAccountAddressRequested(manifest);

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.bitcoinFamilyAccountAddressFail(manifest);
    return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
  }

  const account = accounts.find(account => account.id === accountId);
  if (account === undefined) {
    tracking.bitcoinFamilyAccountAddressFail(manifest);
    return Promise.reject(new Error("account not found"));
  }

  if (!isAccount(account) || account.currency.family !== "bitcoin") {
    tracking.bitcoinFamilyAccountAddressFail(manifest);
    return Promise.reject(new Error("account requested is not a bitcoin family account"));
  }

  if (derivationPath) {
    const path = derivationPath.split("/");
    const accountNumber = Number(path[0]);
    const index = Number(path[1]);

    if (Number.isNaN(accountNumber) || Number.isNaN(index)) {
      tracking.bitcoinFamilyAccountAddressFail(manifest);
      return Promise.reject(new Error("Invalid derivationPath"));
    }

    const walletAccount = getWalletAccount(account);
    const address = walletAccount.xpub.crypto.getAddress(
      walletAccount.xpub.derivationMode,
      walletAccount.xpub.xpub,
      accountNumber,
      index,
    );
    tracking.bitcoinFamilyAccountAddressSuccess(manifest);
    return Promise.resolve(address);
  }

  tracking.bitcoinFamilyAccountAddressSuccess(manifest);
  return Promise.resolve(account.freshAddress);
};

function getRelativePath(path: string) {
  const splitPath = path.split("'/");
  return splitPath[splitPath.length - 1];
}

export const bitcoinFamilyAccountGetPublicKeyLogic = async (
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  derivationPath?: string,
): Promise<string> => {
  tracking.bitcoinFamilyAccountPublicKeyRequested(manifest);

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.bitcoinFamilyAccountPublicKeyFail(manifest);
    return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
  }

  const account = accounts.find(account => account.id === accountId);
  if (account === undefined) {
    tracking.bitcoinFamilyAccountPublicKeyFail(manifest);
    return Promise.reject(new Error("account not found"));
  }

  if (!isAccount(account) || account.currency.family !== "bitcoin") {
    tracking.bitcoinFamilyAccountPublicKeyFail(manifest);
    return Promise.reject(new Error("account requested is not a bitcoin family account"));
  }

  const path = derivationPath?.split("/") ?? getRelativePath(account.freshAddressPath).split("/");
  const accountNumber = Number(path[0]);
  const index = Number(path[1]);

  if (Number.isNaN(accountNumber) || Number.isNaN(index)) {
    tracking.bitcoinFamilyAccountPublicKeyFail(manifest);
    return Promise.reject(new Error("Invalid derivationPath"));
  }

  const walletAccount = getWalletAccount(account);
  const publicKey = await walletAccount.xpub.crypto.getPubkeyAt(
    walletAccount.xpub.xpub,
    accountNumber,
    index,
  );
  tracking.bitcoinFamilyAccountPublicKeySuccess(manifest);
  return publicKey.toString("hex");
};

export const bitcoinFamilyAccountGetXPubLogic = (
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
): Promise<string> => {
  tracking.bitcoinFamilyAccountXpubRequested(manifest);

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.bitcoinFamilyAccountXpubFail(manifest);
    return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
  }

  const account = accounts.find(account => account.id === accountId);
  if (account === undefined) {
    tracking.bitcoinFamilyAccountXpubFail(manifest);
    return Promise.reject(new Error("account not found"));
  }

  if (!isAccount(account) || account.currency.family !== "bitcoin") {
    tracking.bitcoinFamilyAccountXpubFail(manifest);
    return Promise.reject(new Error("account requested is not a bitcoin family account"));
  }

  if (!account.xpub) {
    tracking.bitcoinFamilyAccountXpubFail(manifest);
    return Promise.reject(new Error("account xpub not available"));
  }

  tracking.bitcoinFamilyAccountXpubSuccess(manifest);
  return Promise.resolve(account.xpub);
};

export function startExchangeLogic(
  { manifest, tracking }: WalletAPIContext,
  exchangeType: "SWAP" | "FUND" | "SELL" | "SWAP_NG" | "SELL_NG" | "FUND_NG",
  uiNavigation: (
    exchangeType: "SWAP" | "FUND" | "SELL" | "SWAP_NG" | "SELL_NG" | "FUND_NG",
  ) => Promise<string>,
): Promise<string> {
  tracking.startExchangeRequested(manifest);

  return uiNavigation(exchangeType);
}

export type CompleteExchangeRequest = {
  provider: string;
  fromAccountId: string;
  toAccountId?: string;
  transaction: WalletAPITransaction;
  binaryPayload: string;
  signature: string;
  feesStrategy: string;
  exchangeType: number;
  swapId?: string;
  rate?: number;
  amountExpectedTo?: number;
  tokenCurrency?: string;
};
export type CompleteExchangeUiRequest = {
  provider: string;
  exchange: Exchange;
  transaction: Transaction;
  binaryPayload: string;
  signature: string;
  feesStrategy: string;
  exchangeType: number;
  swapId?: string;
  rate?: number;
  amountExpectedTo?: number;
  tokenCurrency?: string;
};

export function completeExchangeLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  {
    provider,
    fromAccountId,
    toAccountId,
    transaction,
    binaryPayload,
    signature,
    feesStrategy,
    exchangeType,
    swapId,
    rate,
    tokenCurrency,
  }: CompleteExchangeRequest,
  uiNavigation: (request: CompleteExchangeUiRequest) => Promise<string>,
): Promise<string> {
  tracking.completeExchangeRequested(manifest);

  const realFromAccountId = getAccountIdFromWalletAccountId(fromAccountId);
  if (!realFromAccountId) {
    return Promise.reject(new Error(`accountId ${fromAccountId} unknown`));
  }

  // Nb get a hold of the actual accounts, and parent accounts
  const fromAccount = accounts.find(a => a.id === realFromAccountId);

  let toAccount;

  if (toAccountId) {
    const realToAccountId = getAccountIdFromWalletAccountId(toAccountId);
    if (!realToAccountId) {
      return Promise.reject(new Error(`accountId ${toAccountId} unknown`));
    }

    toAccount = accounts.find(a => a.id === realToAccountId);
  }

  if (!fromAccount) {
    return Promise.reject();
  }

  if (exchangeType === 0x00 && !toAccount) {
    // if we do a swap, a destination account must be provided
    return Promise.reject();
  }

  const fromParentAccount = getParentAccount(fromAccount, accounts);
  const currency = tokenCurrency ? findTokenById(tokenCurrency) : null;
  const newTokenAccount = currency ? makeEmptyTokenAccount(toAccount, currency) : null;
  const toParentAccount = toAccount ? getParentAccount(toAccount, accounts) : undefined;
  const exchange = {
    fromAccount,
    fromParentAccount: fromAccount !== fromParentAccount ? fromParentAccount : undefined,
    toAccount: newTokenAccount ? newTokenAccount : toAccount,
    toParentAccount: newTokenAccount ? toAccount : toParentAccount,
  };

  const accountBridge = getAccountBridge(fromAccount, fromParentAccount);
  const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);
  const mainFromAccountFamily = mainFromAccount.currency.family;

  const { liveTx } = getWalletAPITransactionSignFlowInfos({
    walletApiTransaction: transaction,
    account: mainFromAccount,
  });

  if (liveTx.family !== mainFromAccountFamily) {
    return Promise.reject(
      new Error(
        `Account and transaction must be from the same family. Account family: ${mainFromAccountFamily}, Transaction family: ${liveTx.family}`,
      ),
    );
  }

  /**
   * 'subAccountId' is used for ETH and it's ERC-20 tokens.
   * This field is ignored for BTC
   */
  const subAccountId = exchange.fromParentAccount ? fromAccount.id : undefined;

  const bridgeTx = accountBridge.createTransaction(mainFromAccount);
  /**
   * We append the `recipient` to the tx created from `createTransaction`
   * to avoid having userGasLimit reset to null for ETH txs
   * cf. libs/ledger-live-common/src/families/ethereum/updateTransaction.ts
   */
  const tx = accountBridge.updateTransaction(
    {
      ...bridgeTx,
      recipient: liveTx.recipient,
    },
    {
      ...liveTx,
      feesStrategy: feesStrategy.toLowerCase(),
      subAccountId,
    },
  );

  return uiNavigation({
    provider,
    exchange,
    transaction: tx,
    binaryPayload,
    signature,
    feesStrategy,
    exchangeType,
    swapId,
    rate,
  });
}
