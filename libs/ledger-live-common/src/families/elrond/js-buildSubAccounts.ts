import {
  findTokenById,
  listTokensForCryptoCurrency,
} from "@ledgerhq/cryptoassets";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { emptyHistoryCache } from "../../account";
import { getAccountESDTOperations, getAccountESDTTokens } from "./api";

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
  const extractedId = token.id;
  const id = parentAccountId + "+" + extractedId;
  const tokenIdentifierHex = token.id.split("/")[2];
  const tokenIdentifier = Buffer.from(tokenIdentifierHex, "hex").toString();

  const operations = await getAccountESDTOperations(
    parentAccountId,
    accountAddress,
    tokenIdentifier
  );

  const tokenAccount: TokenAccount = {
    type: "TokenAccount",
    id,
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

  const existingAccountByTicker = {}; // used for fast lookup

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
    const token = findTokenById(`elrond/esdt/${esdtIdentifierHex}`);

    if (token && !blacklistedTokenIds.includes(token.id)) {
      const tokenAccount = await buildElrondESDTTokenAccount({
        parentAccountId: accountId,
        accountAddress,
        token,
        balance: new BigNumber(esdt.balance),
      });

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
