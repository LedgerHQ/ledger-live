import { AccountShapeInfo, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import BigNumber from "bignumber.js";

import { emptyHistoryCache, encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import {
  getAccountMinimumBalanceForRentExemption,
  getTransactions,
  ParsedOnChainStakeAccountWithInfo,
  toStakeAccountWithInfo,
  TransactionDescriptor,
} from "./api/chain/web3";
import { getTokenById } from "@ledgerhq/cryptoassets";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import {
  Awaited,
  encodeAccountIdWithTokenAccountAddress,
  isStakeLockUpInForce,
  tokenIsListedOnLedger,
  toTokenId,
  toTokenMint,
  withdrawableFromStake,
} from "./logic";
import {
  compact,
  filter,
  groupBy,
  keyBy,
  toPairs,
  pipe,
  map,
  uniqBy,
  flow,
  sortBy,
  sum,
} from "lodash/fp";
import { parseQuiet } from "./api/chain/program";
import {
  InflationReward,
  ParsedTransactionMeta,
  ParsedMessageAccount,
  ParsedTransaction,
  StakeActivationData,
} from "@solana/web3.js";
import { ChainAPI } from "./api";
import {
  ParsedOnChainTokenAccountWithInfo,
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  toTokenAccountWithInfo,
} from "./api/chain/web3";
import { drainSeq } from "./utils";
import { estimateTxFee } from "./tx-fees";
import { SolanaAccount, SolanaOperationExtra, SolanaStake } from "./types";
import { Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import { DelegateInfo, WithdrawInfo } from "./api/chain/instruction/stake/types";

type OnChainTokenAccount = Awaited<ReturnType<typeof getAccount>>["tokenAccounts"][number];

export const getAccountShapeWithAPI = async (
  info: AccountShapeInfo,
  api: ChainAPI,
): Promise<Partial<SolanaAccount>> => {
  const {
    address: mainAccAddress,
    initialAccount: mainInitialAcc,
    currency,
    derivationMode,
  } = info;

  const {
    blockHeight,
    balance: mainAccBalance,
    tokenAccounts: onChaintokenAccounts,
    stakes: onChainStakes,
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
    v => new Map(toPairs(v)),
  )();

  const subAccByMint = pipe(
    () => mainInitialAcc?.subAccounts ?? [],
    filter((subAcc): subAcc is TokenAccount => subAcc.type === "TokenAccount"),
    keyBy(subAcc => toTokenMint(subAcc.token.id)),
    v => new Map(toPairs(v)),
  )();

  const nextSubAccs: TokenAccount[] = [];

  for (const [mint, accs] of onChainTokenAccsByMint.entries()) {
    if (!tokenIsListedOnLedger(mint)) {
      continue;
    }

    const assocTokenAccAddress = await api.findAssocTokenAccAddress(mainAccAddress, mint);

    const assocTokenAcc = accs.find(
      ({ onChainAcc: { pubkey } }) => pubkey.toBase58() === assocTokenAccAddress,
    );

    if (assocTokenAcc === undefined) {
      continue;
    }

    const subAcc = subAccByMint.get(mint);

    const lastSyncedTxSignature = subAcc?.operations?.[0].hash;

    const txs = await getTransactions(
      assocTokenAcc.onChainAcc.pubkey.toBase58(),
      lastSyncedTxSignature,
      api,
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

  const { epoch } = await api.getEpochInfo();

  const stakes: SolanaStake[] = onChainStakes.map(({ account, activation, reward }) => {
    const {
      info: { meta, stake },
    } = account;
    const rentExemptReserve = account.info.meta.rentExemptReserve.toNumber();
    const stakeAccBalance = account.onChainAcc.account.lamports;
    const hasWithdrawAuth =
      meta.authorized.withdrawer.toBase58() === mainAccAddress &&
      !isStakeLockUpInForce({
        lockup: meta.lockup,
        custodianAddress: mainAccAddress,
        epoch,
      });

    return {
      stakeAccAddr: account.onChainAcc.pubkey.toBase58(),
      stakeAccBalance,
      rentExemptReserve,
      hasStakeAuth: meta.authorized.staker.toBase58() === mainAccAddress,
      hasWithdrawAuth,
      delegation:
        stake === null
          ? undefined
          : {
              stake: activation.state === "inactive" ? 0 : stake.delegation.stake.toNumber(),
              voteAccAddr: stake.delegation.voter.toBase58(),
            },
      activation,
      withdrawable: hasWithdrawAuth
        ? withdrawableFromStake({
            stakeAccBalance,
            activation,
            rentExemptReserve,
          })
        : 0,
      reward:
        reward === null
          ? undefined
          : {
              amount: reward.amount,
            },
    };
  });

  const sortedStakes = flow(
    () => stakes,
    sortBy([
      stake => -(stake.delegation?.stake ?? 0),
      stake => -stake.withdrawable,
      stake => -stake.stakeAccAddr,
    ]),
  )();

  const mainAccountLastTxSignature = mainInitialAcc?.operations[0]?.hash;

  const newMainAccTxs = await getTransactions(mainAccAddress, mainAccountLastTxSignature, api);

  const lastOpSeqNumber = mainInitialAcc?.operations?.[0]?.transactionSequenceNumber ?? 0;
  const newOpsCount = newMainAccTxs.length;

  const newMainAccOps = newMainAccTxs
    .map((tx, i) =>
      txToMainAccOperation(
        tx,
        mainAccountId,
        mainAccAddress,
        // transactions are ordered by date (0'th - most recent tx)
        lastOpSeqNumber + newOpsCount - i,
      ),
    )
    .filter((op): op is Operation => op !== undefined);

  const mainAccTotalOperations = mergeOps(mainInitialAcc?.operations ?? [], newMainAccOps);

  const totalStakedBalance = sum(stakes.map(s => s.stakeAccBalance));

  const mainAccountRentExempt = await getAccountMinimumBalanceForRentExemption(api, mainAccAddress);

  let unstakeReserve = 0;
  if (stakes.length > 0) {
    const undelegateFee = await estimateTxFee(api, mainAccAddress, "stake.undelegate");
    const withdrawFee = await estimateTxFee(api, mainAccAddress, "stake.withdraw");

    const activeStakes = stakes.filter(
      s => s.activation.state == "active" || s.activation.state == "activating",
    );

    // "active" and "activating" stakes require "deactivating" + "withdrawing" steps
    // "inactive" and "deactivating" stakes require withdrawing only
    unstakeReserve = stakes.length * withdrawFee + activeStakes.length * undelegateFee;
  }

  const shape: Partial<SolanaAccount> = {
    // uncomment when tokens are supported
    // subAccounts as undefined makes TokenList disappear in desktop
    //subAccounts: nextSubAccs,
    id: mainAccountId,
    blockHeight,
    balance: mainAccBalance.plus(totalStakedBalance),
    spendableBalance: BigNumber.max(
      mainAccBalance.minus(mainAccountRentExempt).minus(unstakeReserve),
      0,
    ),
    operations: mainAccTotalOperations,
    operationsCount: mainAccTotalOperations.length,
    solanaResources: {
      stakes: sortedStakes,
      unstakeReserve: BigNumber.min(
        unstakeReserve,
        BigNumber.max(mainAccBalance.minus(mainAccountRentExempt), 0),
      ),
    },
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

  const creationDate = new Date((firstTx.info.blockTime ?? Date.now() / 1000) * 1000);

  const tokenId = toTokenId(assocTokenAcc.info.mint.toBase58());
  const tokenCurrency = getTokenById(tokenId);

  const accosTokenAccPubkey = assocTokenAcc.onChainAcc.pubkey;

  const accountId = encodeAccountIdWithTokenAccountAddress(
    mainAccountId,
    accosTokenAccPubkey.toBase58(),
  );

  const balance = new BigNumber(assocTokenAcc.info.tokenAmount.amount);

  const newOps = compact(txs.map(tx => txToTokenAccOperation(tx, assocTokenAcc, accountId)));

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

  const newOps = compact(txs.map(tx => txToTokenAccOperation(tx, assocTokenAcc, subAcc.id)));

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
  accountAddress: string,
  txSeqNumber: number,
): Operation | undefined {
  if (!tx.info.blockTime || !tx.parsed.meta) {
    return undefined;
  }

  const { message } = tx.parsed.transaction;

  const accountIndex = message.accountKeys.findIndex(
    pma => pma.pubkey.toBase58() === accountAddress,
  );

  if (accountIndex < 0) {
    return undefined;
  }

  const { preBalances, postBalances } = tx.parsed.meta;

  const balanceDelta = new BigNumber(postBalances[accountIndex]).minus(
    new BigNumber(preBalances[accountIndex]),
  );

  const isFeePayer = accountIndex === 0;
  const txFee = new BigNumber(tx.parsed.meta.fee);

  const opType = getMainAccOperationType({
    tx: tx.parsed.transaction,
    fee: txFee,
    isFeePayer,
    balanceDelta,
  });

  const accum = {
    senders: [] as string[],
    recipients: [] as string[],
  };

  const { senders, recipients } =
    opType === "IN" || opType === "OUT"
      ? message.accountKeys.reduce((acc, account, i) => {
          const delta = new BigNumber(postBalances[i]).minus(new BigNumber(preBalances[i]));
          if (delta.lt(0)) {
            const shouldConsiderAsSender = i > 0 || !delta.negated().eq(txFee);
            if (shouldConsiderAsSender) {
              acc.senders.push(account.pubkey.toBase58());
            }
          } else if (delta.gt(0)) {
            acc.recipients.push(account.pubkey.toBase58());
          }
          return acc;
        }, accum)
      : accum;

  const txHash = tx.info.signature;
  const txDate = new Date(tx.info.blockTime * 1000);

  const opFee = isFeePayer ? txFee : new BigNumber(0);
  const opValue = getOpValue(balanceDelta, opFee, opType);

  return {
    id: encodeOperationId(accountId, txHash, opType),
    hash: txHash,
    accountId: accountId,
    hasFailed: !!tx.info.err,
    blockHeight: tx.info.slot,
    blockHash: message.recentBlockhash,
    extra: getOpExtra(tx, balanceDelta, opType),
    type: opType,
    senders,
    recipients,
    date: txDate,
    value: opValue,
    fee: opFee,
    transactionSequenceNumber: txSeqNumber,
  };
}

function getOpValue(balanceDelta: BigNumber, opFee: BigNumber, opType: OperationType): BigNumber {
  const value = balanceDelta.abs();
  switch (opType) {
    case "DELEGATE":
    case "WITHDRAW_UNBONDED":
      return opFee;
    case "OPT_OUT":
      return value.negated();
    default:
      return value;
  }
}

function getOpExtra(
  tx: TransactionDescriptor,
  balanceDelta: BigNumber,
  opType: OperationType,
): SolanaOperationExtra {
  const extra: SolanaOperationExtra = {};
  const { instructions } = tx.parsed.transaction.message;
  const parsedIxs = instructions
    .map(ix => parseQuiet(ix))
    .filter(({ program }) => program !== "spl-memo");

  if (tx.info.memo !== null) {
    extra.memo = dropMemoLengthPrefixIfAny(tx.info.memo);
  }

  if (opType === "DELEGATE") {
    const delegateInfo = parsedIxs.find(
      ix => ix.program === "stake" && ix.instruction?.type === "delegate",
    )?.instruction?.info as DelegateInfo;
    if (!delegateInfo) return extra;

    extra.stake = {
      address: delegateInfo.voteAccount.toBase58(),
      amount: balanceDelta.abs(),
    };
  }

  if (opType === "WITHDRAW_UNBONDED") {
    const withdrawInfo = parsedIxs.find(
      ix => ix.program === "stake" && ix.instruction?.type === "withdraw",
    )?.instruction?.info as WithdrawInfo;
    if (!withdrawInfo) return extra;

    extra.stake = {
      address: withdrawInfo.stakeAccount.toBase58(),
      amount: new BigNumber(withdrawInfo.lamports),
    };
  }

  return extra;
}

function txToTokenAccOperation(
  tx: TransactionDescriptor,
  assocTokenAcc: OnChainTokenAccount,
  accountId: string,
): Operation | undefined {
  if (!tx.info.blockTime || !tx.parsed.meta) {
    return undefined;
  }

  const assocTokenAccIndex = tx.parsed.transaction.message.accountKeys.findIndex(v =>
    v.pubkey.equals(assocTokenAcc.onChainAcc.pubkey),
  );

  if (assocTokenAccIndex < 0) {
    return undefined;
  }

  const { preTokenBalances, postTokenBalances } = tx.parsed.meta;

  const preTokenBalance = preTokenBalances?.find(b => b.accountIndex === assocTokenAccIndex);

  const postTokenBalance = postTokenBalances?.find(b => b.accountIndex === assocTokenAccIndex);

  const delta = new BigNumber(postTokenBalance?.uiTokenAmount.amount ?? 0).minus(
    new BigNumber(preTokenBalance?.uiTokenAmount.amount ?? 0),
  );

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
    extra: getOpExtra(tx, delta, opType),
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

function getMainAccOperationTypeFromTx(tx: ParsedTransaction): OperationType | undefined {
  const { instructions } = tx.message;

  const parsedIxs = instructions
    .map(ix => parseQuiet(ix))
    .filter(({ program }) => program !== "spl-memo" && program !== "unknown");

  if (parsedIxs.length === 3) {
    const [first, second, third] = parsedIxs;
    if (
      first.program === "system" &&
      (first.instruction.type === "createAccountWithSeed" ||
        first.instruction.type === "createAccount") &&
      second.program === "stake" &&
      second.instruction.type === "initialize" &&
      third.program === "stake" &&
      third.instruction.type === "delegate"
    ) {
      return "DELEGATE";
    }
  }

  if (parsedIxs.length === 1) {
    const first = parsedIxs[0];

    switch (first.program) {
      case "spl-associated-token-account":
        switch (first.instruction.type) {
          case "associate":
            return "OPT_IN";
        }
        // needed for lint
        break;
      case "spl-token":
        switch (first.instruction.type) {
          case "closeAccount":
            return "OPT_OUT";
        }
        break;
      case "stake":
        switch (first.instruction.type) {
          case "delegate":
            return "DELEGATE";
          case "deactivate":
            return "UNDELEGATE";
          case "withdraw":
            return "WITHDRAW_UNBONDED";
        }
        break;
      default:
        return undefined;
    }
  }

  return undefined;
}

function getTokenSendersRecipients({
  meta,
  accounts,
}: {
  meta: ParsedTransactionMeta;
  accounts: ParsedMessageAccount[];
}) {
  const { preTokenBalances, postTokenBalances } = meta;
  return accounts.reduce(
    (accum, account, i) => {
      const preTokenBalance = preTokenBalances?.find(b => b.accountIndex === i);
      const postTokenBalance = postTokenBalances?.find(b => b.accountIndex === i);
      if (preTokenBalance && postTokenBalance) {
        const tokenDelta = new BigNumber(postTokenBalance.uiTokenAmount.amount).minus(
          new BigNumber(preTokenBalance.uiTokenAmount.amount),
        );

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
    },
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
    .map(ix => parseQuiet(ix))
    .filter(({ program }) => program !== "spl-memo" && program !== "unknown");

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
  api: ChainAPI,
): Promise<{
  balance: BigNumber;
  blockHeight: number;
  tokenAccounts: ParsedOnChainTokenAccountWithInfo[];
  stakes: {
    account: ParsedOnChainStakeAccountWithInfo;
    activation: StakeActivationData;
    reward: InflationReward | null;
  }[];
}> {
  const balanceLamportsWithContext = await api.getBalanceAndContext(address);

  const tokenAccounts: ParsedOnChainTokenAccountWithInfo[] = [];

  // no tokens for the first release
  /*await api
    .getParsedTokenAccountsByOwner(address)
    .then((res) => res.value)
    .then(map(toTokenAccountWithInfo));
    */

  const stakeAccountsRaw = [
    // ...(await api.getStakeAccountsByStakeAuth(address)),
    ...(await api.getStakeAccountsByWithdrawAuth(address)),
  ];

  const stakeAccounts = flow(
    () => stakeAccountsRaw,
    uniqBy(acc => acc.pubkey.toBase58()),
    map(toStakeAccountWithInfo),
    compact,
  )();

  /*
  Ledger team still decides if we should show rewards
  const stakeRewards = await api.getInflationReward(
    stakeAccounts.map(({ onChainAcc }) => onChainAcc.pubkey.toBase58())
  );
  */

  const stakes = await drainSeq(
    stakeAccounts.map(account => async () => {
      return {
        account,
        activation: await api.getStakeActivation(account.onChainAcc.pubkey.toBase58()),
        //reward: stakeRewards[idx],
        reward: null,
      };
    }),
  );

  const balance = new BigNumber(balanceLamportsWithContext.value);
  const blockHeight = balanceLamportsWithContext.context.slot;

  return {
    balance,
    blockHeight,
    tokenAccounts,
    stakes,
  };
}
