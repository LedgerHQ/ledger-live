import { emptyHistoryCache, encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { AccountShapeInfo, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { Operation, OperationType, ProtoNFT, TokenAccount } from "@ledgerhq/types-live";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  InflationReward,
  ParsedTransaction,
  PublicKey,
  StakeActivationData,
} from "@solana/web3.js";
import BigNumber from "bignumber.js";

import ky from "ky";
import compact from "lodash/compact";
import { keyBy, toPairs, pipe, flow, sortBy, sum } from "lodash/fp";
import groupBy from "lodash/groupBy";
import head from "lodash/head";
import coinConfig from "./config";
import { getTokenAccountProgramId, tokenIsListedOnLedger } from "./helpers/token";
import {
  encodeAccountIdWithTokenAccountAddress,
  isStakeLockUpInForce,
  withdrawableFromStake,
} from "./logic";
import { ChainAPI } from "./network";
import { tryParseAsMintAccount } from "./network/chain/account";
import { MintExtensions } from "./network/chain/account/tokenExtensions";
import { DelegateInfo, WithdrawInfo } from "./network/chain/instruction/stake/types";
import { parseQuiet } from "./network/chain/program";
import { PARSED_PROGRAMS } from "./network/chain/program/constants";
import { getStakeAccounts } from "./network/chain/stake-activation/rpc";
import {
  getAccountMinimumBalanceForRentExemption,
  getTokenAccruedInterestDelta,
  getTransactions,
  ParsedOnChainStakeAccountWithInfo,
  toTokenAccountWithInfo,
  TransactionDescriptor,
} from "./network/chain/web3";
import { ParsedOnChainTokenAccountWithInfo } from "./network/chain/web3";
import { estimateTxFee } from "./tx-fees";
import {
  SolanaAccount,
  SolanaOperationExtra,
  SolanaStake,
  SolanaTokenAccount,
  SolanaTokenAccountExtensions,
  SolanaTokenProgram,
} from "./types";
import { isSignaturesForAddressResponse } from "./utils";

export async function getAccount(
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
  const [
    {
      value: balanceValue,
      context: { slot: blockHeight },
    },
    tokenAccountsRaw,
    token2022AccountsRaw,
    stakes,
  ] = await Promise.all([
    api.getBalanceAndContext(address),
    api.getParsedTokenAccountsByOwner(address).then(r => r.value),
    coinConfig.getCoinConfig().token2022Enabled
      ? api.getParsedToken2022AccountsByOwner(address).then(r => r.value)
      : Promise.resolve([]),
    getStakeAccounts(api, address),
  ]);

  return {
    balance: new BigNumber(balanceValue),
    blockHeight,
    tokenAccounts: [...tokenAccountsRaw, ...token2022AccountsRaw].map(toTokenAccountWithInfo),
    stakes,
  };
}

export async function getTokenAccountsTransactions(
  accounts: Array<{
    associatedTokenAccount: ParsedOnChainTokenAccountWithInfo;
    knownTokenAccount: TokenAccount | undefined;
  }>,
  api: ChainAPI,
): Promise<
  Array<{
    mint: string;
    associatedTokenAccountAddress: string;
    descriptors: Array<TransactionDescriptor>;
  }>
> {
  const signatures = await ky
    .post(api.config.endpoint, {
      json: accounts.map(({ associatedTokenAccount, knownTokenAccount }) => ({
        jsonrpc: "2.0",
        method: "getSignaturesForAddress",
        params: [
          associatedTokenAccount.onChainAcc.pubkey.toBase58(),
          {
            commitment: "confirmed",
            limit: 100,
            until: head(knownTokenAccount?.operations)?.hash,
          },
        ],
        id: `${associatedTokenAccount.info.mint.toBase58()}_${associatedTokenAccount.onChainAcc.pubkey.toBase58()}_${Date.now()}`,
      })),
    })
    .json();
  const signaturesJSON = Array.isArray(signatures)
    ? signatures.filter(isSignaturesForAddressResponse)
    : [];
  const signaturesJSONWithInfo = signaturesJSON.map(({ result, id }) => {
    const [mint, associatedTokenAccountAddress] = id.split("_");
    return { result, mint, associatedTokenAccountAddress };
  });
  const transactions = await Promise.all(
    signaturesJSONWithInfo.map(async json => {
      const txs = json.result.length
        ? await api.getParsedTransactions(json.result.map(({ signature }) => signature))
        : [];
      const sortedTxs = txs.sort((a, b) => (b?.slot ?? 0) - (a?.slot ?? 0));
      const descriptors = sortedTxs.reduce((acc, tx) => {
        if (tx && !tx.meta?.err && tx.blockTime) {
          const info = json.result.find(s => tx.transaction.signatures.includes(s.signature))!;
          if (info) {
            acc.push({
              info,
              parsed: tx,
            });
          }
        }
        return acc;
      }, [] as TransactionDescriptor[]);
      return {
        mint: json.mint,
        associatedTokenAccountAddress: json.associatedTokenAccountAddress,
        descriptors,
      };
    }),
  );
  return transactions;
}

function toAssociatedTokenAccount(
  mint: string,
  owner: string,
  accounts: ParsedOnChainTokenAccountWithInfo[],
  knownTokenAccounts: Map<string, TokenAccount>,
) {
  const tokenProgram = accounts[0].onChainAcc.account.data.program as SolanaTokenProgram;
  const associatedTokenAccountAddress = getAssociatedTokenAddressSync(
    new PublicKey(mint),
    new PublicKey(owner),
    undefined,
    getTokenAccountProgramId(tokenProgram),
  );
  const associatedTokenAccount = accounts.find(({ onChainAcc: { pubkey } }) =>
    associatedTokenAccountAddress.equals(pubkey),
  );
  if (!associatedTokenAccount) return associatedTokenAccount;
  return { associatedTokenAccount, knownTokenAccount: knownTokenAccounts.get(mint), tokenProgram };
}

const tokenAccountIsNFT = (tokenAccount: ParsedOnChainTokenAccountWithInfo) => {
  return (
    tokenAccount &&
    // amount could be above 1 if it was minted again
    // should we also support/allow them ?
    tokenAccount.info.tokenAmount.uiAmount === 1 &&
    tokenAccount.info.tokenAmount.decimals === 0
  );
};

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
    tokenAccounts: onChainTokenAccounts,
    stakes: onChainStakes,
  } = await getAccount(mainAccAddress, api);

  const mainAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: mainAccAddress,
    derivationMode,
  });

  // known token accounts
  const subAccByMint = pipe(
    () => mainInitialAcc?.subAccounts ?? [],
    keyBy(subAcc => subAcc.token.contractAddress),
    v => new Map(toPairs(v)),
  )();

  // all token accounts
  const supportedOnChainTokenAccounts = await Promise.all(
    onChainTokenAccounts.map(async account => {
      const isListed = await tokenIsListedOnLedger(currency.id, account.info.mint.toBase58());
      return isListed ? account : null;
    }),
  ).then(results =>
    results.filter((account): account is NonNullable<typeof account> => account !== null),
  );
  const supportedOnChainTokenAccountsByMint = groupBy(
    supportedOnChainTokenAccounts,
    account => account.info.mint,
  );
  const onChainAssociatedTokenAccounts = compact(
    Object.entries<ParsedOnChainTokenAccountWithInfo[]>(supportedOnChainTokenAccountsByMint).map(
      ([mint, accounts]) => toAssociatedTokenAccount(mint, mainAccAddress, accounts, subAccByMint),
    ),
  );
  const onChainAssociatedTokenAccountsByAddress = Object.fromEntries(
    onChainAssociatedTokenAccounts.map(account => [
      account.associatedTokenAccount.onChainAcc.pubkey.toBase58(),
      account,
    ]),
  );

  const mints = Object.keys(supportedOnChainTokenAccountsByMint);
  const mintInfos = (await api.getMultipleAccounts(mints)).map(account => {
    if (!account || !("parsed" in account.data)) return undefined;
    const mintInfo = tryParseAsMintAccount(account.data);
    return mintInfo instanceof Error ? undefined : mintInfo?.extensions;
  });
  const mintInfosByMint = Object.fromEntries(mints.map((mint, i) => [mint, mintInfos[i]]));

  const accountsWithTransactions = onChainAssociatedTokenAccounts.length
    ? await getTokenAccountsTransactions(onChainAssociatedTokenAccounts, api)
    : [];
  const nextSubAccs: TokenAccount[] = await Promise.all(
    accountsWithTransactions.map(account => {
      const {
        associatedTokenAccount: assocTokenAcc,
        knownTokenAccount: subAcc,
        tokenProgram,
      } = onChainAssociatedTokenAccountsByAddress[account.associatedTokenAccountAddress];

      const mintExtensions =
        tokenProgram === PARSED_PROGRAMS.SPL_TOKEN_2022 ? mintInfosByMint[account.mint] : undefined;

      return subAcc === undefined
        ? newSubAcc({
            api,
            currencyId: currency.id,
            mainAccountId,
            assocTokenAcc,
            txs: account.descriptors,
            mintExtensions,
          })
        : patchedSubAcc({
            api,
            subAcc,
            assocTokenAcc,
            txs: account.descriptors,
            mintExtensions,
          });
    }),
  );

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

  const lastOpSeqNumber = Number(mainInitialAcc?.operations?.[0]?.transactionSequenceNumber ?? 0);
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
    const [undelegateFee, withdrawFee] = await Promise.all([
      estimateTxFee(api, mainAccAddress, "stake.undelegate"),
      estimateTxFee(api, mainAccAddress, "stake.withdraw"),
    ]);

    const activeStakes = stakes.filter(
      s => s.activation.state === "active" || s.activation.state === "activating",
    );

    // "active" and "activating" stakes require "deactivating" + "withdrawing" steps
    // "inactive" and "deactivating" stakes require withdrawing only
    unstakeReserve = stakes.length * withdrawFee + activeStakes.length * undelegateFee;
  }

  const nextNfts: ProtoNFT[] = [];
  for (const tokenAccount of onChainTokenAccounts) {
    const isListed = await tokenIsListedOnLedger(currency.id, tokenAccount.info.mint.toBase58());
    if (!isListed && tokenAccountIsNFT(tokenAccount)) {
      const mint = tokenAccount.info.mint.toBase58();
      // A fake tokenId is used as the mint address for the contract field with NMS
      // because we don't have the collection with the node data
      // We would need to fetch the metaplex metdata associated to this account
      const tokenId = "0";
      const id = encodeNftId(mainAccountId, tokenId, mint, currency.id);
      nextNfts.push({
        id,
        contract: mint,
        tokenId: tokenId,
        amount: new BigNumber(0),
        standard: "SPL",
        currencyId: currency.id,
      });
    }
  }

  const shape: Partial<SolanaAccount> = {
    nfts: nextNfts,
    subAccounts: nextSubAccs,
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

async function newSubAcc({
  api,
  currencyId,
  mainAccountId,
  assocTokenAcc,
  txs,
  mintExtensions,
}: {
  api: ChainAPI;
  currencyId: string;
  mainAccountId: string;
  assocTokenAcc: ParsedOnChainTokenAccountWithInfo;
  txs: TransactionDescriptor[];
  mintExtensions: MintExtensions | undefined;
}): Promise<SolanaTokenAccount> {
  const lastTx = txs[txs.length - 1];
  const creationDate = new Date((lastTx?.info.blockTime ?? Date.now() / 1000) * 1000);

  const mint = assocTokenAcc.info.mint.toBase58();
  const tokenCurrency = await getCryptoAssetsStore().findTokenByAddressInCurrency(mint, currencyId);

  if (!tokenCurrency) {
    throw new Error(`token for mint "${mint}" not found`);
  }

  const accosTokenAccPubkey = assocTokenAcc.onChainAcc.pubkey;

  const accountId = encodeAccountIdWithTokenAccountAddress(
    mainAccountId,
    accosTokenAccPubkey.toBase58(),
  );

  const balance = new BigNumber(assocTokenAcc.info.tokenAmount.amount);

  const newOps = compact(txs.map(tx => txToTokenAccOperation(tx, assocTokenAcc, accountId)));

  const extensions =
    mintExtensions || assocTokenAcc.info.extensions
      ? await toSolanaTokenAccExtensions(api, assocTokenAcc, mintExtensions)
      : undefined;

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
    extensions,
    token: tokenCurrency,
    state: assocTokenAcc.info.state,
    type: "TokenAccount",
  };
}

async function patchedSubAcc({
  api,
  subAcc,
  assocTokenAcc,
  txs,
  mintExtensions,
}: {
  api: ChainAPI;
  subAcc: TokenAccount;
  assocTokenAcc: ParsedOnChainTokenAccountWithInfo;
  txs: TransactionDescriptor[];
  mintExtensions: MintExtensions | undefined;
}): Promise<SolanaTokenAccount> {
  const balance = new BigNumber(assocTokenAcc.info.tokenAmount.amount);

  const newOps = compact(txs.map(tx => txToTokenAccOperation(tx, assocTokenAcc, subAcc.id)));

  const totalOps = mergeOps(subAcc.operations, newOps);
  const extensions =
    mintExtensions || assocTokenAcc.info.extensions
      ? await toSolanaTokenAccExtensions(api, assocTokenAcc, mintExtensions)
      : undefined;

  return {
    ...subAcc,
    balance,
    spendableBalance: balance,
    operations: totalOps,
    state: assocTokenAcc.info.state,
    extensions,
  };
}

async function toSolanaTokenAccExtensions(
  api: ChainAPI,
  assocTokenAcc: ParsedOnChainTokenAccountWithInfo,
  mintExtensions?: MintExtensions,
) {
  const extensions = [...(mintExtensions || []), ...(assocTokenAcc.info.extensions || [])];
  return extensions.reduce<Promise<SolanaTokenAccountExtensions>>(async (prevPromise, tokenExt) => {
    const acc = await prevPromise;
    switch (tokenExt.extension) {
      case "interestBearingConfig": {
        const delta = await getTokenAccruedInterestDelta(
          api,
          BigNumber(assocTokenAcc.info.tokenAmount.amount),
          assocTokenAcc.info.tokenAmount.decimals,
          assocTokenAcc.info.mint.toBase58(),
          assocTokenAcc.info.owner.toBase58(),
        );
        return {
          ...acc,
          interestRate: {
            rateBps: tokenExt.state.currentRate,
            accruedDelta: delta?.toNumber(),
          },
        };
      }
      case "nonTransferable":
        return { ...acc, nonTransferable: true };
      case "permanentDelegate":
        return {
          ...acc,
          permanentDelegate: { delegateAddress: tokenExt.state?.delegate?.toBase58() },
        };
      case "memoTransfer":
        return { ...acc, requiredMemoOnTransfer: !!tokenExt.state.requireIncomingTransferMemos };
      case "transferFeeConfig": {
        const { epoch } = await api.getEpochInfo();
        const { newerTransferFee, olderTransferFee } = tokenExt.state;
        const transferFee = epoch >= newerTransferFee.epoch ? newerTransferFee : olderTransferFee;
        return {
          ...acc,
          transferFee: {
            feeBps: transferFee.transferFeeBasisPoints,
            maxFee: transferFee.maximumFee,
          },
        };
      }
      case "transferHook": {
        return {
          ...acc,
          transferHook: { programAddress: tokenExt.state?.programId?.toBase58() },
        };
      }
      default:
        return acc;
    }
  }, Promise.resolve({}));
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

  const { senders, recipients } = getMainSendersRecipients(tx, opType, txFee, accountAddress);

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
    transactionSequenceNumber: new BigNumber(txSeqNumber),
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
    .filter(({ program }) => program !== PARSED_PROGRAMS.SPL_MEMO);

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
  assocTokenAcc: ParsedOnChainTokenAccountWithInfo,
  accountId: string,
): Operation | undefined {
  if (!tx.info.blockTime || !tx.parsed.meta) {
    return undefined;
  }

  const { message } = tx.parsed.transaction;
  const assocTokenAccIndex = tx.parsed.transaction.message.accountKeys.findIndex(v =>
    v.pubkey.equals(assocTokenAcc.onChainAcc.pubkey),
  );

  const accountOwner = assocTokenAcc.info.owner.toBase58();
  const accountOwnerIndex = message.accountKeys.findIndex(
    pma => pma.pubkey.toBase58() === accountOwner,
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

  const isFeePayer = accountOwnerIndex === 0;
  const txFee = new BigNumber(tx.parsed.meta.fee);

  const opType = getTokenAccOperationType({ tx: tx.parsed.transaction, delta });

  const txHash = tx.info.signature;
  const opFee = isFeePayer ? txFee : new BigNumber(0);

  const { senders, recipients } = getTokenSendersRecipients(tx);

  return {
    id: encodeOperationId(accountId, txHash, opType),
    accountId,
    type: opType,
    hash: txHash,
    date: new Date(tx.info.blockTime * 1000),
    blockHeight: tx.info.slot,
    fee: opFee,
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
  const type = getMainAccOperationTypeFromTx(tx, isFeePayer);

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

function getMainSendersRecipients(
  tx: TransactionDescriptor,
  opType: OperationType,
  txFee: BigNumber,
  accountAddress: string,
) {
  const initialSendersRecipients = {
    senders: [] as string[],
    recipients: [] as string[],
  };
  if (!tx.parsed.meta) {
    return initialSendersRecipients;
  }

  const { message } = tx.parsed.transaction;
  const { postTokenBalances, preBalances, postBalances } = tx.parsed.meta;

  if (opType === "FEES") {
    // SPL transfer to existing ATA. FEES operation is shown for the main account
    return getTokenSendersRecipients(tx);
  }

  if (opType === "OPT_IN") {
    // Associated token account created
    const incomingTokens =
      postTokenBalances?.filter(tokenBalance => tokenBalance.owner === accountAddress) || [];

    initialSendersRecipients.senders = incomingTokens.map(token => token.mint);
    initialSendersRecipients.recipients = incomingTokens.map(token => {
      return message.accountKeys[token.accountIndex].pubkey.toBase58();
    }) || [accountAddress];

    return initialSendersRecipients;
  }

  if (opType === "IN" || opType === "OUT") {
    const isAccFeePayer = (accIndex: number) => accIndex === 0;

    return message.accountKeys.reduce((acc, account, i) => {
      const delta = new BigNumber(postBalances[i]).minus(new BigNumber(preBalances[i]));
      if (delta.lt(0)) {
        const shouldConsiderAsSender = !isAccFeePayer(i) || !delta.negated().eq(txFee);
        if (shouldConsiderAsSender) {
          acc.senders.push(account.pubkey.toBase58());
        }
      } else if (delta.gt(0)) {
        acc.recipients.push(account.pubkey.toBase58());
      }
      return acc;
    }, initialSendersRecipients);
  }

  return initialSendersRecipients;
}

function getMainAccOperationTypeFromTx(
  tx: ParsedTransaction,
  isFeePayer: boolean,
): OperationType | undefined {
  const parsedIxs = parseTxInstructions(tx);

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
      case PARSED_PROGRAMS.SPL_ASSOCIATED_TOKEN_ACCOUNT:
        if (first.instruction.type === "associate") {
          return isFeePayer ? "OPT_OUT" : "OPT_IN";
        }
        break;
      case PARSED_PROGRAMS.SPL_TOKEN:
      case PARSED_PROGRAMS.SPL_TOKEN_2022:
        switch (first.instruction.type) {
          case "closeAccount":
            return "OPT_OUT";
          case "freezeAccount":
            return "FREEZE";
          case "thawAccount":
            return "UNFREEZE";
        }
        break;
      case PARSED_PROGRAMS.STAKE:
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

function getTokenSendersRecipients(tx: TransactionDescriptor) {
  const initialSendersRecipients = {
    senders: [] as string[],
    recipients: [] as string[],
  };

  if (!tx.parsed.meta) {
    return initialSendersRecipients;
  }

  const accounts = tx.parsed.transaction.message.accountKeys;
  const { preTokenBalances, postTokenBalances } = tx.parsed.meta;

  return accounts.reduce((accum, account, i) => {
    const preTokenBalance = preTokenBalances?.find(b => b.accountIndex === i);
    const postTokenBalance = postTokenBalances?.find(b => b.accountIndex === i);
    if (preTokenBalance || postTokenBalance) {
      const tokenDelta = new BigNumber(postTokenBalance?.uiTokenAmount.amount ?? 0).minus(
        new BigNumber(preTokenBalance?.uiTokenAmount.amount ?? 0),
      );
      if (tokenDelta.lt(0)) {
        accum.senders.push(postTokenBalance?.owner || account.pubkey.toBase58());
      } else if (tokenDelta.gt(0)) {
        accum.recipients.push(postTokenBalance?.owner || account.pubkey.toBase58());
      }
    }
    return accum;
  }, initialSendersRecipients);
}

function getTokenAccOperationType({
  tx,
  delta,
}: {
  tx: ParsedTransaction;
  delta: BigNumber;
}): OperationType {
  const parsedIxs = parseTxInstructions(tx);
  const [mainIx, ...otherIxs] = parsedIxs;

  if (mainIx !== undefined && otherIxs.length === 0) {
    switch (mainIx.program) {
      case PARSED_PROGRAMS.SPL_ASSOCIATED_TOKEN_ACCOUNT:
        if (mainIx.instruction.type === "associate") {
          return "NONE"; // ATA opt-in operation is added to the main account
        }
        break;
      case PARSED_PROGRAMS.SPL_TOKEN:
      case PARSED_PROGRAMS.SPL_TOKEN_2022:
        switch (mainIx.instruction.type) {
          case "freezeAccount":
            return "FREEZE";
          case "thawAccount":
            return "UNFREEZE";
          case "burn":
            return "BURN";
        }
    }
  }

  const fallbackType = delta.eq(0) ? "NONE" : delta.gt(0) ? "IN" : "OUT";
  return fallbackType;
}

function parseTxInstructions(tx: ParsedTransaction) {
  return tx.message.instructions
    .map(ix => parseQuiet(ix))
    .filter(
      ({ program }) => program !== PARSED_PROGRAMS.SPL_MEMO && program !== PARSED_PROGRAMS.UNKNOWN,
    );
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
