import {
  findTokenById,
  listTokensForCryptoCurrency,
} from "@ledgerhq/cryptoassets";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { emptyHistoryCache, encodeTokenAccountId } from "../../account";
import { mergeOps } from "../../bridge/jsHelpers";
import { getESDTOperations, getAccountESDTTokens } from "./api";
import { addPrefixToken, extractTokenId } from "./logic";

async function buildElrondESDTTokenAccount({
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

  const operations = await getESDTOperations(
    tokenAccountId,
    accountAddress,
    tokenIdentifier,
    0
  );

  const tokenAccount: TokenAccount = {
    type: "TokenAccount",
    id: tokenAccountId,
    parentId: parentAccountId,
    starred: false,
    token,
    operationsCount: operations.length,
    operations,
    pendingOperations: [],
    balance,
    spendableBalance: balance,
    swapHistory: [],
    creationDate:
      operations.length > 0
        ? operations[operations.length - 1].date
        : new Date(),
    balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
  };
  return tokenAccount;
}

async function syncESDTTokenAccountOperations(
  tokenAccount: TokenAccount,
  address: string
): Promise<TokenAccount> {
  const oldOperations = tokenAccount?.operations || [];
  // Needed for incremental synchronisation
  const startAt = oldOperations.length
    ? Math.floor(oldOperations[0].date.valueOf() / 1000)
    : 0;

  const tokenIdentifierHex = extractTokenId(tokenAccount.token.id);
  const tokenIdentifier = Buffer.from(tokenIdentifierHex, "hex").toString();

  // Merge new operations with the previously synced ones
  const newOperations = await getESDTOperations(
    tokenAccount.id,
    address,
    tokenIdentifier,
    startAt
  );
  const operations = mergeOps(oldOperations, newOperations);

  if (operations === oldOperations) return tokenAccount;

  const copy = { ...tokenAccount };
  copy.operations = operations;
  copy.operationsCount = operations.length;
  return copy;
}

async function elrondBuildESDTTokenAccounts({
  currency,
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
  if (listTokensForCryptoCurrency(currency).length === 0) {
    return undefined;
  }

  const tokenAccounts: TokenAccount[] = [];

  const existingAccountByTicker: { [key: string]: TokenAccount } = {}; // used for fast lookup

  const existingAccountTickers: string[] = []; // used to keep track of ordering

  if (existingAccount && existingAccount.subAccounts) {
    for (const existingSubAccount of existingAccount.subAccounts) {
      if (existingSubAccount.type === "TokenAccount") {
        const { ticker, id } = existingSubAccount.token;

        if (!blacklistedTokenIds.includes(id)) {
          existingAccountTickers.push(ticker);
          existingAccountByTicker[ticker] = existingSubAccount;
        }
      }
    }
  }

  const accountESDTs = await getAccountESDTTokens(accountAddress);
  for (const esdt of accountESDTs) {
    const esdtIdentifierHex = Buffer.from(esdt.identifier).toString("hex");
    const token = findTokenById(addPrefixToken(esdtIdentifierHex));

    if (token && !blacklistedTokenIds.includes(token.id)) {
      let tokenAccount = existingAccountByTicker[token.ticker];
      if (!tokenAccount) {
        tokenAccount = await buildElrondESDTTokenAccount({
          parentAccountId: accountId,
          accountAddress,
          token,
          balance: new BigNumber(esdt.balance),
        });
      } else {
        const inputTokenAccount = tokenAccount;
        tokenAccount = await syncESDTTokenAccountOperations(
          inputTokenAccount,
          accountAddress
        );
        const balance = new BigNumber(esdt.balance);
        if (!balance.eq(tokenAccount.balance)) {
          // only recreate the object if balance changed
          if (inputTokenAccount === tokenAccount) {
            tokenAccount = { ...tokenAccount };
          }
          tokenAccount.balance = balance;
          tokenAccount.spendableBalance = balance;
        }
      }

      if (tokenAccount) {
        tokenAccounts.push(tokenAccount);
        existingAccountTickers.push(token.ticker);
        existingAccountByTicker[token.ticker] = tokenAccount;
      }
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

export default elrondBuildESDTTokenAccounts;
