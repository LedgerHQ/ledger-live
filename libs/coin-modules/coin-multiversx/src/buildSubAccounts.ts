import { emptyHistoryCache, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getESDTOperations, getAccountESDTTokens } from "./api";
import { addPrefixToken, extractTokenId } from "./logic";
import { ESDTToken } from "./types";

async function buildMultiversXESDTTokenAccount({
  parentAccountId,
  accountAddress,
  token,
  balance,
}: {
  parentAccountId: string;
  accountAddress: string;
  token: TokenCurrency;
  balance: BigNumber;
}) {
  const tokenAccountId = encodeTokenAccountId(parentAccountId, token);
  const tokenIdentifierHex = extractTokenId(token.id);
  const tokenIdentifier = Buffer.from(tokenIdentifierHex, "hex").toString();

  const operations = await getESDTOperations(tokenAccountId, accountAddress, tokenIdentifier, 0);

  const tokenAccount: TokenAccount = {
    type: "TokenAccount",
    id: tokenAccountId,
    parentId: parentAccountId,
    token,
    operationsCount: operations.length,
    operations,
    pendingOperations: [],
    balance,
    spendableBalance: balance,
    swapHistory: [],
    creationDate: operations.length > 0 ? operations[operations.length - 1].date : new Date(),
    balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
  };
  return tokenAccount;
}

function buildExistingAccountMaps(
  existingAccount: Account | null | undefined,
  blacklistedTokenIds: string[],
): { existingAccountByTicker: Record<string, TokenAccount>; existingAccountTickers: string[] } {
  const existingAccountByTicker: Record<string, TokenAccount> = {};
  const existingAccountTickers: string[] = [];

  if (!existingAccount?.subAccounts) {
    return { existingAccountByTicker, existingAccountTickers };
  }

  for (const existingSubAccount of existingAccount.subAccounts) {
    if (existingSubAccount.type !== "TokenAccount") continue;

    const { ticker, id } = existingSubAccount.token;

    if (!blacklistedTokenIds.includes(id)) {
      existingAccountTickers.push(ticker);
      existingAccountByTicker[ticker] = existingSubAccount;
    }
  }

  return { existingAccountByTicker, existingAccountTickers };
}

async function syncESDTTokenAccountOperations(
  tokenAccount: TokenAccount,
  address: string,
): Promise<TokenAccount> {
  const oldOperations = tokenAccount?.operations || [];
  const startAt = oldOperations.length ? Math.floor(oldOperations[0].date.valueOf() / 1000) : 0;

  const tokenIdentifierHex = extractTokenId(tokenAccount.token.id);
  const tokenIdentifier = Buffer.from(tokenIdentifierHex, "hex").toString();

  const newOperations = await getESDTOperations(tokenAccount.id, address, tokenIdentifier, startAt);
  const operations = mergeOps(oldOperations, newOperations);

  if (operations === oldOperations) return tokenAccount;

  return {
    ...tokenAccount,
    operations,
    operationsCount: operations.length,
  };
}

async function updateTokenAccountBalance(
  tokenAccount: TokenAccount,
  newBalance: BigNumber,
): Promise<TokenAccount> {
  if (newBalance.eq(tokenAccount.balance)) {
    return tokenAccount;
  }

  return {
    ...tokenAccount,
    balance: newBalance,
    spendableBalance: newBalance,
  };
}

async function processESDT({
  esdt,
  accountId,
  accountAddress,
  existingAccountByTicker,
  existingAccountTickers,
  blacklistedTokenIds,
}: {
  esdt: ESDTToken;
  accountId: string;
  accountAddress: string;
  existingAccountByTicker: Record<string, TokenAccount>;
  existingAccountTickers: string[];
  blacklistedTokenIds: string[];
}): Promise<TokenAccount | null> {
  const esdtIdentifierHex = Buffer.from(esdt.identifier).toString("hex");
  const token = await getCryptoAssetsStore().findTokenById(addPrefixToken(esdtIdentifierHex));

  if (!token || blacklistedTokenIds.includes(token.id)) {
    return null;
  }

  const existingTokenAccount = existingAccountByTicker[token.ticker];
  const balance = new BigNumber(esdt.balance);

  let tokenAccount: TokenAccount;

  if (existingTokenAccount) {
    const syncedTokenAccount = await syncESDTTokenAccountOperations(
      existingTokenAccount,
      accountAddress,
    );
    tokenAccount = await updateTokenAccountBalance(syncedTokenAccount, balance);
  } else {
    tokenAccount = await buildMultiversXESDTTokenAccount({
      parentAccountId: accountId,
      accountAddress,
      token,
      balance,
    });
  }

  existingAccountTickers.push(token.ticker);
  existingAccountByTicker[token.ticker] = tokenAccount;

  return tokenAccount;
}

async function MultiversXBuildESDTTokenAccounts({
  accountId,
  accountAddress,
  existingAccount,
  syncConfig,
}: {
  currency: CryptoCurrency;
  accountId: string;
  accountAddress: string;
  existingAccount: Account | null | undefined;
  syncConfig: SyncConfig;
}): Promise<TokenAccount[] | undefined> {
  const { blacklistedTokenIds = [] } = syncConfig;
  const tokenAccounts: TokenAccount[] = [];

  const { existingAccountByTicker, existingAccountTickers } = buildExistingAccountMaps(
    existingAccount,
    blacklistedTokenIds,
  );

  const accountESDTs = await getAccountESDTTokens(accountAddress);
  for (const esdt of accountESDTs) {
    const tokenAccount = await processESDT({
      esdt,
      accountId,
      accountAddress,
      existingAccountByTicker,
      existingAccountTickers,
      blacklistedTokenIds,
    });

    if (tokenAccount) {
      tokenAccounts.push(tokenAccount);
    }
  }

  // Preserve order of tokenAccounts from the existing token accounts
  tokenAccounts.sort((a, b) => {
    const i = existingAccountTickers.indexOf(a.token.ticker);
    const j = existingAccountTickers.indexOf(b.token.ticker);
    if (i === j) return 0;
    if (i < 0) return 1;
    if (j < 0) return -1;
    return i - j;
  });

  return tokenAccounts;
}

export default MultiversXBuildESDTTokenAccounts;
