/* instanbul ignore file: don't test fixtures */

import BigNumber from "bignumber.js";
import {
  DerivationMode,
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import {
  decodeAccountId,
  decodeTokenAccountId,
  encodeTokenAccountId,
  shortAddressPreview,
} from "@ledgerhq/coin-framework/account/index";
import {
  encodeERC1155OperationId,
  encodeERC721OperationId,
} from "@ledgerhq/coin-framework/nft/nftOperationId";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, Operation, ProtoNFT, SubAccount, TokenAccount } from "@ledgerhq/types-live";

export const makeAccount = (
  address: string,
  currency: CryptoCurrency,
  subAccounts: SubAccount[] = [],
): Account => {
  const id = `js:2:${currency.id}:${address}:`;
  const { derivationMode, xpubOrAddress } = decodeAccountId(id);
  const scheme = getDerivationScheme({
    derivationMode: derivationMode as DerivationMode,
    currency,
  });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, currency, {
    account: index,
    node: 0,
    address: 0,
  });

  const account: Account = {
    type: "Account",
    name:
      currency.name + " " + (derivationMode || "legacy") + " " + shortAddressPreview(xpubOrAddress),
    xpub: xpubOrAddress,
    subAccounts,
    seedIdentifier: xpubOrAddress,
    starred: true,
    used: true,
    swapHistory: [],
    id,
    derivationMode,
    currency,
    unit: currency.units[0],
    index,
    nfts: [],
    freshAddress: xpubOrAddress,
    freshAddressPath,
    freshAddresses: [],
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: {
        latestDate: null,
        balances: [],
      },
      DAY: {
        latestDate: null,
        balances: [],
      },
      WEEK: {
        latestDate: null,
        balances: [],
      },
    },
  };

  return Object.freeze(account);
};

export const makeTokenAccount = (address: string, tokenCurrency: TokenCurrency): TokenAccount => {
  const { parentCurrency: currency } = tokenCurrency;
  const account = makeAccount(address, currency);

  const tokenAccountId = encodeTokenAccountId(account.id, tokenCurrency);

  return Object.freeze({
    type: "TokenAccount",
    id: tokenAccountId,
    parentId: account.id,
    token: tokenCurrency,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    starred: false,
    balanceHistoryCache: {
      HOUR: {
        latestDate: null,
        balances: [],
      },
      DAY: {
        latestDate: null,
        balances: [],
      },
      WEEK: {
        latestDate: null,
        balances: [],
      },
    },
    swapHistory: [],
  });
};

export const makeOperation = (partialOp?: Partial<Operation>): Operation => {
  const accountId = partialOp?.accountId ?? "js:2:ethereum:0xkvn:";
  const { xpubOrAddress } = decodeAccountId(
    accountId.includes("+") ? decodeTokenAccountId(accountId).accountId : accountId,
  );
  const hash = partialOp?.hash ?? "0xhash";
  const type = partialOp?.type ?? "OUT";

  return Object.freeze({
    id: encodeOperationId(accountId, hash, type),
    hash,
    type,
    value: new BigNumber(0),
    fee: new BigNumber(0),
    blockHash: null,
    blockHeight: null,
    senders: [xpubOrAddress],
    recipients: ["0xlmb"],
    accountId,
    transactionSequenceNumber: 0,
    date: new Date(),
    nftOperations: [],
    subOperations: [],
    internalOperations: [],
    extra: {},
    ...partialOp,
  });
};

export const makeNftOperation = (
  partialOp?: Partial<Operation>,
  operationIndex?: number,
): Operation => {
  const accountId = partialOp?.accountId ?? "js:2:ethereum:0xkvn:";
  const { xpubOrAddress, currencyId } = decodeAccountId(
    accountId.includes("+") ? decodeTokenAccountId(accountId).accountId : accountId,
  );
  const hash = partialOp?.hash ?? "0xhash";
  const type = partialOp?.type ?? "NFT_OUT";
  const contract = partialOp?.contract ?? "0xNftContract";
  const tokenId = partialOp?.tokenId ?? "tokenId1";
  const standard = partialOp?.standard ?? "ERC721";
  const nftId = encodeNftId(accountId, contract, tokenId, currencyId);

  return Object.freeze({
    id:
      standard === "ERC721"
        ? encodeERC721OperationId(nftId, hash, type, operationIndex)
        : encodeERC1155OperationId(nftId, hash, type, operationIndex),
    hash,
    type,
    value: new BigNumber(0),
    fee: new BigNumber(0),
    blockHash: null,
    blockHeight: null,
    senders: [xpubOrAddress],
    recipients: ["0xlmb"],
    accountId,
    transactionSequenceNumber: 0,
    date: new Date(),
    extra: {},
    ...partialOp,
  });
};

export const makeNft = (partialNft?: Partial<ProtoNFT>): ProtoNFT =>
  Object.freeze({
    id: "NFT-ID",
    tokenId: "1",
    amount: new BigNumber(1),
    contract: "0xNftContract",
    standard: "ERC721",
    currencyId: "ethereum",
    ...partialNft,
  });

export const deepFreeze = <T>(obj: T): Readonly<T> => {
  if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    const propNames = Object.getOwnPropertyNames(obj) as Array<keyof T>;
    propNames.forEach(propName => deepFreeze(obj[propName]));
  }
  return obj;
};
