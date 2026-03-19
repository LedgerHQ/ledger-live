import { AccountLike, getCurrencyForAccount, TokenAccount } from "@ledgerhq/types-live";
import {
  getWalletAPITransactionSignFlowInfos,
  getAccountIdFromWalletAccountId,
} from "../converters";
import { WalletAPITransaction } from "../types";
import { getMainAccount, getParentAccount, makeEmptyTokenAccount } from "../../account/index";
import { Transaction } from "../../generated/types";
import { getAccountBridge } from "../../bridge";
import { Exchange } from "../../exchange/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { WalletAPIContext } from "./context";

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

export async function completeExchangeLogic(
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
    throw new Error(`accountId ${fromAccountId} unknown`);
  }

  const fromAccount = accounts.find(a => a.id === realFromAccountId);

  let toAccount;

  if (toAccountId) {
    const realToAccountId = getAccountIdFromWalletAccountId(toAccountId);
    if (!realToAccountId) {
      throw new Error(`accountId ${toAccountId} unknown`);
    }

    toAccount = accounts.find(a => a.id === realToAccountId);
  }

  if (!fromAccount) {
    throw new Error("From account not found");
  }

  if (exchangeType === 0x00 && !toAccount) {
    throw new Error("To account required for swap");
  }

  const fromParentAccount = getParentAccount(fromAccount, accounts);
  const currency = tokenCurrency ? await getCryptoAssetsStore().findTokenById(tokenCurrency) : null;
  const newTokenAccount = currency ? makeEmptyTokenAccount(toAccount, currency) : undefined;
  const toParentAccount = toAccount ? getParentAccount(toAccount, accounts) : undefined;
  const exchange = {
    fromAccount,
    fromParentAccount: fromAccount !== fromParentAccount ? fromParentAccount : undefined,
    fromCurrency: getCurrencyForAccount(fromAccount),
    toAccount: newTokenAccount ? newTokenAccount : toAccount,
    toParentAccount: newTokenAccount ? toAccount : toParentAccount,
    toCurrency: toAccount ? getToCurrency(toAccount, newTokenAccount) : undefined,
  };

  const accountBridge = getAccountBridge(fromAccount, fromParentAccount);
  const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);
  const mainFromAccountFamily = mainFromAccount.currency.family;

  const { liveTx } = getWalletAPITransactionSignFlowInfos({
    walletApiTransaction: transaction,
    account: fromAccount,
  });

  if (liveTx.family !== mainFromAccountFamily) {
    throw new Error(
      `Account and transaction must be from the same family. Account family: ${mainFromAccountFamily}, Transaction family: ${liveTx.family}`,
    );
  }

  const subAccountId = exchange.fromParentAccount ? fromAccount.id : undefined;

  const bridgeTx = accountBridge.createTransaction(fromAccount);
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

function getToCurrency(account: AccountLike, tokenAccount?: TokenAccount): CryptoOrTokenCurrency {
  return tokenAccount ? getCurrencyForAccount(tokenAccount) : getCurrencyForAccount(account);
}
