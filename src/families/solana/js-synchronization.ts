import { GetAccountShapeArg0, mergeOps } from "../../bridge/jsHelpers";
import {
  Account,
  encodeAccountId,
  Operation,
  OperationType,
  TokenAccount,
} from "../../types";
import BigNumber from "bignumber.js";

import { emptyHistoryCache } from "../../account";
import { getTransactions, TransactionDescriptor } from "./api/chain/web3";
import { getTokenById } from "@ledgerhq/cryptoassets";
import { encodeOperationId } from "../../operation";
import {
  Awaited,
  encodeAccountIdWithTokenAccountAddress,
  tokenIsListedOnLedger,
  toTokenId,
  toTokenMint,
} from "./logic";
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { compact, filter, groupBy, keyBy, toPairs, pipe, map } from "lodash/fp";
import { parseQuiet } from "./api/chain/program";
import {
  ParsedConfirmedTransactionMeta,
  ParsedMessageAccount,
  ParsedTransaction,
} from "@solana/web3.js";
import { ChainAPI } from "./api";
import {
  ParsedOnChainTokenAccountWithInfo,
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  toTokenAccountWithInfo,
} from "./api/chain/web3";

type OnChainTokenAccount = Awaited<
  ReturnType<typeof getAccount>
>["tokenAccounts"][number];

export const getAccountShapeWithAPI = async (
  info: GetAccountShapeArg0,
  api: ChainAPI
): Promise<Partial<Account>> => {
  const {
    address: mainAccAddress,
    initialAccount: mainInitialAcc,
    currency,
    derivationMode,
  } = info;

  const {
    blockHeight,
    balance: mainAccBalance,
    spendableBalance: mainAccSpendableBalance,
    tokenAccounts: onChaintokenAccounts,
  } = await getAccount(mainAccAddress, api);

  const mainAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: mainAccAddress,
    derivationMode,
  });

  const onChainTokenAccsByMint = pipe(
    () => onChaintokenAccounts,
    groupBy(({ info: { mint } }) => mint.toBase58()),
    (v) => new Map(toPairs(v))
  )();

  const subAccByMint = pipe(
    () => mainInitialAcc?.subAccounts ?? [],
    filter((subAcc): subAcc is TokenAccount => subAcc.type === "TokenAccount"),
    keyBy((subAcc) => toTokenMint(subAcc.token.id)),
    (v) => new Map(toPairs(v))
  )();

  const nextSubAccs: TokenAccount[] = [];

  for (const [mint, accs] of onChainTokenAccsByMint.entries()) {
    if (!tokenIsListedOnLedger(mint)) {
      continue;
    }

    const assocTokenAccAddress = await api.findAssocTokenAccAddress(
      mainAccAddress,
      mint
    );

    const assocTokenAcc = accs.find(
      ({ onChainAcc: { pubkey } }) => pubkey.toBase58() === assocTokenAccAddress
    );

    if (assocTokenAcc === undefined) {
      continue;
    }

    const subAcc = subAccByMint.get(mint);

    const lastSyncedTxSignature = subAcc?.operations?.[0].hash;

    const txs = await getTransactions(
      assocTokenAcc.onChainAcc.pubkey.toBase58(),
      lastSyncedTxSignature,
      api
    );

    const nextSubAcc =
      subAcc === undefined
        ? newSubAcc({
            mainAccountId,
            assocTokenAcc,
            txs,
          })
        : patchedSubAcc({
            subAcc,
            assocTokenAcc,
            txs,
          });

    nextSubAccs.push(nextSubAcc);
  }

  const mainAccountLastTxSignature = mainInitialAcc?.operations[0]?.hash;

  const newMainAccTxs = await getTransactions(
    mainAccAddress,
    mainAccountLastTxSignature,
    api
  );

  const newMainAccOps = newMainAccTxs
    .map((tx) => txToMainAccOperation(tx, mainAccountId, mainAccAddress))
    .filter((op): op is Operation => op !== undefined);

  const mainAccTotalOperations = mergeOps(
    mainInitialAcc?.operations ?? [],
    newMainAccOps
  );

  const shape: Partial<Account> = {
    // uncomment when tokens are supported
    // subAccounts as undefined makes TokenList disappear in desktop
    //subAccounts: nextSubAccs,
    id: mainAccountId,
    blockHeight,
    balance: mainAccBalance,
    spendableBalance: mainAccSpendableBalance,
    operations: mainAccTotalOperations,
    operationsCount: mainAccTotalOperations.length,
  };

  return shape;
};

function newSubAcc({
  mainAccountId,
  assocTokenAcc,
  txs,
}: {
  mainAccountId: string;
  assocTokenAcc: OnChainTokenAccount;
  txs: TransactionDescriptor[];
}): TokenAccount {
  const firstTx = txs[txs.length - 1];

  const creationDate = new Date(
    (firstTx.info.blockTime ?? Date.now() / 1000) * 1000
  );

  const tokenId = toTokenId(assocTokenAcc.info.mint.toBase58());
  const tokenCurrency = getTokenById(tokenId);

  const accosTokenAccPubkey = assocTokenAcc.onChainAcc.pubkey;

  const accountId = encodeAccountIdWithTokenAccountAddress(
    mainAccountId,
    accosTokenAccPubkey.toBase58()
  );

  const balance = new BigNumber(assocTokenAcc.info.tokenAmount.amount);

  const newOps = compact(
    txs.map((tx) => txToTokenAccOperation(tx, assocTokenAcc, accountId))
  );

  return {
    balance,
    balanceHistoryCache: emptyHistoryCache,
    creationDate,
    id: accountId,
    parentId: mainAccountId,
    operations: mergeOps([], newOps),
    operationsCount: txs.length,
    pendingOperations: [],
    spendableBalance: balance,
    starred: false,
    swapHistory: [],
    token: tokenCurrency,
    type: "TokenAccount",
  };
}

function patchedSubAcc({
  subAcc,
  assocTokenAcc,
  txs,
}: {
  subAcc: TokenAccount;
  assocTokenAcc: OnChainTokenAccount;
  txs: TransactionDescriptor[];
}): TokenAccount {
  const balance = new BigNumber(assocTokenAcc.info.tokenAmount.amount);

  const newOps = compact(
    txs.map((tx) => txToTokenAccOperation(tx, assocTokenAcc, subAcc.id))
  );

  const totalOps = mergeOps(subAcc.operations, newOps);

  return {
    ...subAcc,
    balance,
    spendableBalance: balance,
    operations: totalOps,
  };
}

function txToMainAccOperation(
  tx: TransactionDescriptor,
  accountId: string,
  accountAddress: string
): Operation | undefined {
  if (!tx.info.blockTime || !tx.parsed.meta) {
    return undefined;
  }

  const { message } = tx.parsed.transaction;

  const accountIndex = message.accountKeys.findIndex(
    (pma) => pma.pubkey.toBase58() === accountAddress
  );

  if (accountIndex < 0) {
    return undefined;
  }

  const { preBalances, postBalances } = tx.parsed.meta;

  const balanceDelta = new BigNumber(postBalances[accountIndex]).minus(
    new BigNumber(preBalances[accountIndex])
  );

  const isFeePayer = accountIndex === 0;
  const txFee = new BigNumber(tx.parsed.meta.fee);

  const opType = getMainAccOperationType({
    tx: tx.parsed.transaction,
    fee: txFee,
    isFeePayer,
    balanceDelta,
  });

  const { senders, recipients } = message.accountKeys.reduce(
    (acc, account, i) => {
      const delta = new BigNumber(postBalances[i]).minus(
        new BigNumber(preBalances[i])
      );
      if (delta.lt(0)) {
        const shouldConsiderAsSender = i > 0 || !delta.negated().eq(txFee);
        if (shouldConsiderAsSender) {
          acc.senders.push(account.pubkey.toBase58());
        }
      } else if (delta.gt(0)) {
        acc.recipients.push(account.pubkey.toBase58());
      }
      return acc;
    },
    {
      senders: [] as string[],
      recipients: [] as string[],
    }
  );

  const txHash = tx.info.signature;
  const txDate = new Date(tx.info.blockTime * 1000);

  const opFee = isFeePayer ? txFee : new BigNumber(0);

  const value = balanceDelta.abs();
  const opValue = opType === "OPT_OUT" ? value.negated() : value;

  return {
    id: encodeOperationId(accountId, txHash, opType),
    hash: txHash,
    accountId: accountId,
    hasFailed: !!tx.info.err,
    blockHeight: tx.info.slot,
    blockHash: message.recentBlockhash,
    extra: getOpExtra(tx),
    type: opType,
    senders,
    recipients,
    date: txDate,
    value: opValue,
    fee: opFee,
  };
}

function getOpExtra(tx: TransactionDescriptor): Record<string, any> {
  const extra: Record<string, any> = {};
  if (tx.info.memo !== null) {
    extra.memo = dropMemoLengthPrefixIfAny(tx.info.memo);
  }

  return extra;
}

function txToTokenAccOperation(
  tx: TransactionDescriptor,
  assocTokenAcc: OnChainTokenAccount,
  accountId: string
): Operation | undefined {
  if (!tx.info.blockTime || !tx.parsed.meta) {
    return undefined;
  }

  const assocTokenAccIndex =
    tx.parsed.transaction.message.accountKeys.findIndex((v) =>
      v.pubkey.equals(assocTokenAcc.onChainAcc.pubkey)
    );

  if (assocTokenAccIndex < 0) {
    return undefined;
  }

  const { preTokenBalances, postTokenBalances } = tx.parsed.meta;

  const preTokenBalance = preTokenBalances?.find(
    (b) => b.accountIndex === assocTokenAccIndex
  );

  const postTokenBalance = postTokenBalances?.find(
    (b) => b.accountIndex === assocTokenAccIndex
  );

  const delta = new BigNumber(
    postTokenBalance?.uiTokenAmount.amount ?? 0
  ).minus(new BigNumber(preTokenBalance?.uiTokenAmount.amount ?? 0));

  const opType = getTokenAccOperationType({ tx: tx.parsed.transaction, delta });

  const txHash = tx.info.signature;

  const { senders, recipients } = getTokenSendersRecipients({
    meta: tx.parsed.meta,
    accounts: tx.parsed.transaction.message.accountKeys,
  });

  return {
    id: encodeOperationId(accountId, txHash, opType),
    accountId,
    type: opType,
    hash: txHash,
    date: new Date(tx.info.blockTime * 1000),
    blockHeight: tx.info.slot,
    fee: new BigNumber(0),
    recipients,
    senders,
    value: delta.abs(),
    hasFailed: !!tx.info.err,
    extra: getOpExtra(tx),
    blockHash: tx.parsed.transaction.message.recentBlockhash,
  };
}

function getMainAccOperationType({
  tx,
  fee,
  isFeePayer,
  balanceDelta,
}: {
  tx: ParsedTransaction;
  fee: BigNumber;
  isFeePayer: boolean;
  balanceDelta: BigNumber;
}): OperationType {
  const type = getMainAccOperationTypeFromTx(tx);

  if (type !== undefined) {
    return type;
  }

  return isFeePayer && balanceDelta.negated().eq(fee)
    ? "FEES"
    : balanceDelta.lt(0)
    ? "OUT"
    : balanceDelta.gt(0)
    ? "IN"
    : "NONE";
}

function getMainAccOperationTypeFromTx(
  tx: ParsedTransaction
): OperationType | undefined {
  const { instructions } = tx.message;
  const [mainIx, ...otherIxs] = instructions
    .map((ix) => parseQuiet(ix))
    .filter(({ program }) => program !== "spl-memo");

  if (mainIx === undefined || otherIxs.length > 0) {
    return undefined;
  }

  switch (mainIx.program) {
    case "spl-associated-token-account":
      switch (mainIx.instruction.type) {
        case "associate":
          return "OPT_IN";
      }
      // needed for lint
      break;
    case "spl-token":
      switch (mainIx.instruction.type) {
        case "closeAccount":
          return "OPT_OUT";
      }
      break;
    // disabled until staking support
    /*
    case "stake":
      switch (mainIx.instruction.type) {
        case "delegate":
          return "DELEGATE";
        case "deactivate":
          return "UNDELEGATE";
      }
      break;
      */
    default:
      return undefined;
  }
}

function getTokenSendersRecipients({
  meta,
  accounts,
}: {
  meta: ParsedConfirmedTransactionMeta;
  accounts: ParsedMessageAccount[];
}) {
  const { preTokenBalances, postTokenBalances } = meta;
  return accounts.reduce(
    (accum, account, i) => {
      const preTokenBalance = preTokenBalances?.find(
        (b) => b.accountIndex === i
      );
      const postTokenBalance = postTokenBalances?.find(
        (b) => b.accountIndex === i
      );
      if (preTokenBalance && postTokenBalance) {
        const tokenDelta = new BigNumber(
          postTokenBalance.uiTokenAmount.amount
        ).minus(new BigNumber(preTokenBalance.uiTokenAmount.amount));

        if (tokenDelta.lt(0)) {
          accum.senders.push(account.pubkey.toBase58());
        } else if (tokenDelta.gt(0)) {
          accum.recipients.push(account.pubkey.toBase58());
        }
      }
      return accum;
    },
    {
      senders: [] as string[],
      recipients: [] as string[],
    }
  );
}

function getTokenAccOperationType({
  tx,
  delta,
}: {
  tx: ParsedTransaction;
  delta: BigNumber;
}): OperationType {
  const { instructions } = tx.message;
  const [mainIx, ...otherIxs] = instructions
    .map((ix) => parseQuiet(ix))
    .filter(({ program }) => program !== "spl-memo");

  if (mainIx !== undefined && otherIxs.length === 0) {
    switch (mainIx.program) {
      case "spl-associated-token-account":
        switch (mainIx.instruction.type) {
          case "associate":
            return "OPT_IN";
        }
    }
  }

  const fallbackType = delta.eq(0) ? "NONE" : delta.gt(0) ? "IN" : "OUT";
  return fallbackType;
}

function dropMemoLengthPrefixIfAny(memo: string) {
  const lengthPrefixMatch = memo.match(/^\[(\d+)\]\s/);
  if (lengthPrefixMatch) {
    const prefixLength = Number(lengthPrefixMatch[1]);
    if (Number.isInteger(prefixLength) && prefixLength < memo.length) {
      return memo.slice(-prefixLength);
    }
  }
  return memo;
}

async function getAccount(
  address: string,
  api: ChainAPI
): Promise<{
  balance: BigNumber;
  spendableBalance: BigNumber;
  blockHeight: number;
  tokenAccounts: ParsedOnChainTokenAccountWithInfo[];
}> {
  const balanceLamportsWithContext = await api.getBalanceAndContext(address);

  const tokenAccounts = [];

  // no tokens for the first release
  /*await api
    .getParsedTokenAccountsByOwner(address)
    .then((res) => res.value)
    .then(map(toTokenAccountWithInfo));
    */

  const balance = new BigNumber(balanceLamportsWithContext.value);
  const blockHeight = balanceLamportsWithContext.context.slot;

  return {
    tokenAccounts,
    balance,
    spendableBalance: balance,
    blockHeight,
  };
}
