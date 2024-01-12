import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import flatMap from "lodash/flatMap";
import compact from "lodash/compact";
import get from "lodash/get";
import sumBy from "lodash/sumBy";
import { findTokenById } from "@ledgerhq/cryptoassets";
import type {
  Account,
  Operation,
  TokenAccount,
  SubAccount,
  SignedOperation,
  AccountLike,
  CurrencyBridge,
  AccountBridge,
  SignOperationFnSignature,
} from "@ledgerhq/types-live";
import type {
  NetworkInfo,
  SuperRepresentative,
  Transaction,
  TransactionStatus,
  TronAccount,
  TronOperation,
  TrongridExtraTxInfo,
} from "../types";
import {
  isParentTx,
  txInfoToOperation,
  getOperationTypefromMode,
  getEstimatedBlockSize,
} from "../utils";
import { withDevice } from "../../../hw/deviceAccess";
import signTransaction from "../../../hw/signTransaction";
import { makeSync, makeScanAccounts } from "../../../bridge/jsHelpers";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { formatCurrencyUnit } from "../../../currencies";
import {
  getAccountUnit,
  getMainAccount,
  encodeTokenAccountId,
  emptyHistoryCache,
  encodeAccountId,
} from "../../../account";
import { getOperationsPageSize } from "../../../pagination";
import {
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecipientRequired,
  NotEnoughBalance,
  AmountRequired,
} from "@ledgerhq/errors";
import {
  TronNoFrozenForBandwidth,
  TronNoFrozenForEnergy,
  TronUnfreezeNotExpired,
  TronVoteRequired,
  TronInvalidVoteCount,
  TronInvalidFreezeAmount,
  TronRewardNotAvailable,
  TronNoReward,
  TronSendTrc20ToNewAccountForbidden,
  TronUnexpectedFees,
  TronNotEnoughTronPower,
  TronNotEnoughEnergy,
  TronNoUnfrozenResource,
  TronInvalidUnDelegateResourceAmount,
  TronLegacyUnfreezeNotExpired,
} from "../errors";
import {
  broadcastTron,
  claimRewardTronTransaction,
  createTronTransaction,
  extractBandwidthInfo,
  fetchTronAccount,
  fetchTronAccountTxs,
  fetchTronContract,
  getTronAccountNetwork,
  getTronResources,
  getTronSuperRepresentatives,
  hydrateSuperRepresentatives,
  validateAddress,
  freezeTronTransaction,
  voteTronSuperRepresentatives,
  fetchCurrentBlockHeight,
  getContractUserEnergyRatioConsumption,
  withdrawExpireUnfreezeTronTransaction,
  unDelegateResourceTransaction,
  unfreezeTronTransaction,
  getDelegatedResource,
  legacyUnfreezeTronTransaction,
} from "../api";
import { activationFees, oneTrx } from "../constants";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import type { AccountShapeInfo } from "../../../bridge/jsHelpers";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

const receive = makeAccountBridgeReceive();

const signOperation: SignOperationFnSignature<Transaction> = ({ account, transaction, deviceId }) =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          const subAccount =
            transaction.subAccountId && account.subAccounts
              ? account.subAccounts.find(sa => sa.id === transaction.subAccountId)
              : null;
          const isContractAddressRecipient =
            (await fetchTronContract(transaction.recipient)) !== undefined;
          const fee = await getEstimatedFees(account, transaction, isContractAddressRecipient);
          const balance = subAccount
            ? subAccount.balance
            : BigNumber.max(0, account.spendableBalance.minus(fee));

          if (transaction.useAllAmount) {
            transaction = { ...transaction }; // transaction object must not be mutated
            transaction.amount = balance; // force the amount to be the max
          }

          // send trc20 to a new account is forbidden by us (because it will not activate the account)
          if (
            transaction.recipient &&
            transaction.mode === "send" &&
            subAccount &&
            subAccount.type === "TokenAccount" &&
            subAccount.token.tokenType === "trc20" &&
            !isContractAddressRecipient && // send trc20 to a smart contract is allowed
            (await fetchTronAccount(transaction.recipient)).length === 0
          ) {
            throw new TronSendTrc20ToNewAccountForbidden();
          }

          const getPreparedTransaction = () => {
            switch (transaction.mode) {
              case "freeze":
                return freezeTronTransaction(account, transaction);

              case "unfreeze":
                return unfreezeTronTransaction(account, transaction);

              case "vote":
                return voteTronSuperRepresentatives(account, transaction);

              case "claimReward":
                return claimRewardTronTransaction(account);

              case "withdrawExpireUnfreeze":
                return withdrawExpireUnfreezeTronTransaction(account, transaction);

              case "unDelegateResource":
                return unDelegateResourceTransaction(account, transaction);

              case "legacyUnfreeze":
                return legacyUnfreezeTronTransaction(account, transaction);

              default:
                return createTronTransaction(account, transaction, subAccount);
            }
          };

          const preparedTransaction = await getPreparedTransaction();

          o.next({
            type: "device-signature-requested",
          });
          // Sign by device
          const signature = await signTransaction(
            account.currency,
            transport,
            account.freshAddressPath,
            {
              rawDataHex: preparedTransaction.raw_data_hex,
              // only for trc10, we need to put the token ledger signature
              tokenSignature:
                subAccount &&
                subAccount.type === "TokenAccount" &&
                subAccount.token.id.includes("trc10")
                  ? subAccount.token.ledgerSignature
                  : undefined,
            },
          );
          o.next({
            type: "device-signature-granted",
          });
          const hash = preparedTransaction.txID;

          const getValue = (): BigNumber => {
            switch (transaction.mode) {
              case "send":
                return subAccount ? fee : new BigNumber(transaction.amount || 0).plus(fee);

              case "claimReward": {
                const tronAcc = account as TronAccount;
                return tronAcc.tronResources
                  ? tronAcc.tronResources.unwithdrawnReward
                  : new BigNumber(0);
              }

              default:
                return new BigNumber(0);
            }
          };

          const value = getValue();
          const operationType = getOperationTypefromMode(transaction.mode);
          const resource = transaction.resource || "BANDWIDTH";

          const getExtra = (): TrongridExtraTxInfo | null | undefined => {
            switch (transaction.mode) {
              case "freeze":
                return {
                  frozenAmount: transaction.amount,
                };

              case "unfreeze":
                return {
                  unfreezeAmount: transaction.amount,
                };

              case "vote":
                return {
                  votes: transaction.votes,
                };

              case "unDelegateResource":
                return {
                  unDelegatedAmount: transaction.amount,
                  receiverAddress: transaction.recipient,
                };

              case "legacyUnfreeze":
                return {
                  unfreezeAmount: get(
                    (account as TronAccount).tronResources,
                    `frozen.${resource.toLocaleLowerCase()}.amount`,
                    new BigNumber(0),
                  ),
                };

              default:
                return undefined;
            }
          };

          const extra = getExtra() || {};
          /**
           * FIXME
           *
           * This is not working and cannot work simply because this "NONE" type doesn't exist during a sync,
           * as well as subOperations which are never created either.
           *
           * And even after fixing this,  we're getting wrong fee estimation for TRC20 transactions
           * which are considered as 0 all the time, while it always being between 1 and 10 TRX.
           */
          const operation: TronOperation = {
            id: encodeOperationId(account.id, hash, operationType),
            hash,
            // if it's a token op and there is no fee, this operation does not exist and is a "NONE"
            type: subAccount && value.eq(0) ? "NONE" : operationType,
            value,
            fee,
            blockHash: null,
            blockHeight: null,
            senders: [account.freshAddress],
            recipients: [transaction.recipient],
            accountId: account.id,
            date: new Date(),
            extra,
          };

          if (subAccount) {
            /**
             * SEE FIXME ABOVE
             */
            operation.subOperations = [
              {
                id: encodeOperationId(subAccount.id, hash, "OUT"),
                hash,
                type: "OUT",
                value:
                  transaction.useAllAmount && subAccount
                    ? subAccount.balance
                    : new BigNumber(transaction.amount || 0),
                fee: new BigNumber(0),
                blockHash: null,
                blockHeight: null,
                senders: [account.freshAddress],
                recipients: [transaction.recipient],
                accountId: subAccount.id,
                date: new Date(),
                extra: {},
              },
            ];
          }

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature,
              rawData: preparedTransaction.raw_data,
            },
          });
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );

const broadcast = async ({
  signedOperation: { signature, operation, rawData },
}: {
  account: Account;
  signedOperation: SignedOperation;
}): Promise<Operation> => {
  const transaction = {
    raw_data: rawData,
    txID: operation.hash,
    signature: [signature],
  };
  const submittedTransaction = await broadcastTron(transaction);

  if (submittedTransaction.result !== true) {
    throw new Error(submittedTransaction.resultMessage);
  }

  return operation;
};

const getAccountShape = async (info: AccountShapeInfo, syncConfig) => {
  const blockHeight = await fetchCurrentBlockHeight();
  const tronAcc = await fetchTronAccount(info.address);

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: info.currency.id,
    xpubOrAddress: info.address,
    derivationMode: info.derivationMode,
  });

  if (tronAcc.length === 0) {
    const defaultTronResources = await getTronResources();

    return {
      id: accountId,
      blockHeight,
      balance: new BigNumber(0),
      tronResources: defaultTronResources,
    };
  }

  const acc = tronAcc[0];
  const spendableBalance = acc.balance ? new BigNumber(acc.balance) : new BigNumber(0);
  const cacheTransactionInfoById = {
    ...(info.initialAccount &&
      (info.initialAccount as TronAccount).tronResources &&
      (info.initialAccount as TronAccount).tronResources.cacheTransactionInfoById),
  };
  const operationsPageSize = Math.min(
    1000,
    getOperationsPageSize(info.initialAccount && info.initialAccount.id, syncConfig),
  );
  // FIXME: this is not optional especially that we might already have info.initialAccount
  // use minimalOperationsBuilderSync to reconciliate and KEEP REF
  const txs = await fetchTronAccountTxs(
    info.address,
    txs => txs.length < operationsPageSize,
    cacheTransactionInfoById,
  );
  const tronResources = await getTronResources(acc, txs, cacheTransactionInfoById);
  const balance = spendableBalance
    .plus(tronResources.frozen.bandwidth ? tronResources.frozen.bandwidth.amount : new BigNumber(0))
    .plus(tronResources.frozen.energy ? tronResources.frozen.energy.amount : new BigNumber(0))
    .plus(
      tronResources.delegatedFrozen.bandwidth
        ? tronResources.delegatedFrozen.bandwidth.amount
        : new BigNumber(0),
    )
    .plus(
      tronResources.delegatedFrozen.energy
        ? tronResources.delegatedFrozen.energy.amount
        : new BigNumber(0),
    )

    .plus(
      tronResources.unFrozen.energy
        ? tronResources.unFrozen.energy.reduce((accum, cur) => {
            return accum.plus(cur.amount);
          }, new BigNumber(0))
        : new BigNumber(0),
    )
    .plus(
      tronResources.unFrozen.bandwidth
        ? tronResources.unFrozen.bandwidth.reduce((accum, cur) => {
            return accum.plus(cur.amount);
          }, new BigNumber(0))
        : new BigNumber(0),
    )
    .plus(
      tronResources.legacyFrozen.bandwidth
        ? tronResources.legacyFrozen.bandwidth.amount
        : new BigNumber(0),
    )
    .plus(
      tronResources.legacyFrozen.energy
        ? tronResources.legacyFrozen.energy.amount
        : new BigNumber(0),
    );

  const parentTxs = txs.filter(isParentTx);
  const parentOperations: TronOperation[] = compact(
    parentTxs.map(tx => txInfoToOperation(accountId, info.address, tx)),
  );
  const trc10Tokens = get(acc, "assetV2", []).map(({ key, value }) => ({
    type: "trc10",
    key,
    value,
  }));
  const trc20Tokens = get(acc, "trc20", []).map(obj => {
    const [[key, value]] = Object.entries(obj);
    return {
      type: "trc20",
      key,
      value,
    };
  });
  // TRC10 and TRC20 accounts
  // FIXME: this is bad for perf: we should reconciliate with potential existing data
  // we need to KEEP REF as much as possible & use minimalOperationsBuilderSync
  const subAccounts: SubAccount[] = compact(
    trc10Tokens.concat(trc20Tokens).map(({ type, key, value }) => {
      const { blacklistedTokenIds = [] } = syncConfig;
      const tokenId = `tron/${type}/${key}`;
      const token = findTokenById(tokenId);
      if (!token || blacklistedTokenIds.includes(tokenId)) return;
      const id = encodeTokenAccountId(accountId, token);
      const tokenTxs = txs.filter(tx => tx.tokenId === key);
      const operations = compact(tokenTxs.map(tx => txInfoToOperation(id, info.address, tx)));
      const maybeExistingSubAccount =
        info.initialAccount &&
        info.initialAccount.subAccounts &&
        info.initialAccount.subAccounts.find(a => a.id === id);
      const balance = new BigNumber(value);
      const sub: TokenAccount = {
        type: "TokenAccount",
        id,
        starred: false,
        parentId: accountId,
        token,
        balance,
        spendableBalance: balance,
        operationsCount: operations.length,
        operations,
        pendingOperations: maybeExistingSubAccount ? maybeExistingSubAccount.pendingOperations : [],
        creationDate: operations.length > 0 ? operations[operations.length - 1].date : new Date(),
        swapHistory: maybeExistingSubAccount ? maybeExistingSubAccount.swapHistory : [],
        balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
      };
      return sub;
    }),
  );
  // get 'OUT' token operations with fee
  const subOutOperationsWithFee: TronOperation[] = flatMap(subAccounts.map(s => s.operations))
    .filter(o => o.type === "OUT" && o.fee.isGreaterThan(0))
    .map(
      (o): TronOperation => ({
        ...o,
        accountId,
        value: o.fee,
        id: encodeOperationId(accountId, o.hash, "OUT"),
        extra: o.extra as TrongridExtraTxInfo,
      }),
    );
  // add them to the parent operations and sort by date desc

  /**
   * FIXME
   *
   * We have a problem here as we're just concatenating ops without ever really linking them.
   * It means no operation can be "FEES" of a subOp by example. It leads to our issues with TRC10/TRC20
   * optimistic operation never really existing in the end.
   */
  const parentOpsAndSubOutOpsWithFee = parentOperations
    .concat(subOutOperationsWithFee)
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());

  return {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: parentOpsAndSubOutOpsWithFee.length,
    operations: parentOpsAndSubOutOpsWithFee,
    subAccounts,
    tronResources,
    blockHeight,
  };
};

const scanAccounts = makeScanAccounts({ getAccountShape });
// the balance does not update straightaway so we should ignore recent operations if they are in pending for a bit
const preferPendingOperationsUntilBlockValidation = 35;

const postSync = (initial: Account, parent: Account): Account => {
  function evictRecentOpsIfPending(a) {
    a.pendingOperations.forEach(pending => {
      const i = a.operations.findIndex(o => o.id === pending.id);

      if (i !== -1) {
        const diff = parent.blockHeight - (a.operations[i].blockHeight || 0);

        if (diff < preferPendingOperationsUntilBlockValidation) {
          a.operations.splice(i, 1);
        }
      }
    });
  }

  evictRecentOpsIfPending(parent);
  parent.subAccounts && parent.subAccounts.forEach(evictRecentOpsIfPending);
  return parent;
};

const sync = makeSync({ getAccountShape, postSync });

const currencyBridge: CurrencyBridge = {
  preload: async () => {
    const superRepresentatives = await getTronSuperRepresentatives();
    return {
      superRepresentatives,
    };
  },
  hydrate: (data?: { superRepresentatives?: SuperRepresentative[] }) => {
    if (!data || !data.superRepresentatives) return;

    const { superRepresentatives } = data;

    if (
      !superRepresentatives ||
      typeof superRepresentatives !== "object" ||
      !Array.isArray(superRepresentatives)
    )
      return;
    hydrateSuperRepresentatives(superRepresentatives);
  },
  scanAccounts,
};

const createTransaction = (): Transaction => ({
  family: "tron",
  amount: new BigNumber(0),
  useAllAmount: false,
  mode: "send",
  duration: 3,
  recipient: "",
  networkInfo: null,
  resource: null,
  votes: [],
});

// see : https://developers.tron.network/docs/bandwith#section-bandwidth-points-consumption
// 1. cost around 200 Bandwidth, if not enough check Free Bandwidth
// 2. If not enough, will cost some TRX
// 3. normal transfert cost around 0.002 TRX
const getFeesFromBandwidth = (a: Account, t: Transaction): BigNumber => {
  const { freeUsed, freeLimit, gainedUsed, gainedLimit } = extractBandwidthInfo(t.networkInfo);
  const available = freeLimit.minus(freeUsed).plus(gainedLimit).minus(gainedUsed);
  const estimatedBandwidthCost = getEstimatedBlockSize(a, t);

  if (available.lt(estimatedBandwidthCost)) {
    return new BigNumber(2000); // cost is around 0.002 TRX
  }

  return new BigNumber(0); // no fee
};

// Special case: If activated an account, cost around 0.1 TRX
const getFeesFromAccountActivation = async (a: Account, t: Transaction): Promise<BigNumber> => {
  const recipientAccount = await fetchTronAccount(t.recipient);
  const { gainedUsed, gainedLimit } = extractBandwidthInfo(t.networkInfo);
  const available = gainedLimit.minus(gainedUsed);
  const estimatedBandwidthCost = getEstimatedBlockSize(a, t);

  if (recipientAccount.length === 0 && available.lt(estimatedBandwidthCost)) {
    return activationFees; // cost is around 1 TRX
  }

  return new BigNumber(0); // no fee
};

const getEstimatedFees = async (a: Account, t: Transaction, isContract: boolean) => {
  const feesFromAccountActivation =
    t.mode === "send" && !isContract ? await getFeesFromAccountActivation(a, t) : new BigNumber(0);

  if (feesFromAccountActivation.gt(0)) {
    return feesFromAccountActivation;
  }

  const feesFromBandwidth = getFeesFromBandwidth(a, t);
  return feesFromBandwidth;
};

const getTransactionStatus = async (a: TronAccount, t: Transaction): Promise<TransactionStatus> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const { family, mode, recipient, resource, votes, useAllAmount = false } = t;
  const tokenAccount = !t.subAccountId
    ? null
    : a.subAccounts && a.subAccounts.find(ta => ta.id === t.subAccountId);
  const account = tokenAccount || a;
  const isContractAddressRecipient = (await fetchTronContract(recipient)) !== undefined;

  if (mode === "send" && !recipient) {
    errors.recipient = new RecipientRequired();
  }

  if (["send", "unDelegateResource", "legacyUnfreeze"].includes(mode)) {
    if (recipient === a.freshAddress) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    } else if (recipient && !(await validateAddress(recipient))) {
      errors.recipient = new InvalidAddress(undefined, {
        currencyName: a.currency.name,
      });
    } else if (
      recipient &&
      mode === "send" &&
      account.type === "TokenAccount" &&
      account.token.tokenType === "trc20" &&
      !isContractAddressRecipient && // send trc20 to a smart contract is allowed
      (await fetchTronAccount(recipient)).length === 0
    ) {
      // send trc20 to a new account is forbidden by us (because it will not activate the account)
      errors.recipient = new TronSendTrc20ToNewAccountForbidden();
    }
  }

  if (mode === "unfreeze") {
    const { bandwidth, energy } = a.tronResources.frozen;
    if (resource === "BANDWIDTH" && t.amount.gt(bandwidth?.amount || new BigNumber(0))) {
      errors.resource = new TronNoFrozenForBandwidth();
    } else if (t.amount.gt(energy?.amount || new BigNumber(0))) {
      errors.resource = new TronNoFrozenForEnergy();
    }
  }

  if (mode === "legacyUnfreeze") {
    const lowerCaseResource = resource ? resource.toLowerCase() : "bandwidth";
    const now = new Date();
    const expiredDatePath = `tronResources.legacyFrozen.${lowerCaseResource}.expiredAt`;
    const expirationDate: Date | null | undefined = get(a, expiredDatePath, undefined);
    if (!expirationDate) {
      if (resource === "BANDWIDTH") {
        errors.resource = new TronNoFrozenForBandwidth();
      } else {
        errors.resource = new TronNoFrozenForEnergy();
      }
    } else if (now.getTime() < expirationDate.getTime()) {
      errors.resource = new TronLegacyUnfreezeNotExpired();
    }
  }

  if (mode === "withdrawExpireUnfreeze") {
    const now = new Date();
    if (
      (!a.tronResources.unFrozen.bandwidth || a.tronResources.unFrozen.bandwidth.length === 0) &&
      (!a.tronResources.unFrozen.energy || a.tronResources.unFrozen.energy.length === 0)
    ) {
      errors.resource = new TronNoUnfrozenResource();
    } else {
      const unfreezingResources = [
        ...(a.tronResources.unFrozen.bandwidth ?? []),
        ...(a.tronResources.unFrozen.energy ?? []),
      ];

      const hasNoExpiredResource = !unfreezingResources.some(
        unfrozen => unfrozen.expireTime.getTime() <= now.getTime(),
      );

      if (hasNoExpiredResource) {
        const closestExpireTime = unfreezingResources.reduce((closest, current) => {
          if (!closest) {
            return current;
          }
          const closestTimeDifference = Math.abs(closest.expireTime.getTime() - now.getTime());
          const currentTimeDifference = Math.abs(current.expireTime.getTime() - now.getTime());

          return currentTimeDifference < closestTimeDifference ? current : closest;
        });
        errors.resource = new TronUnfreezeNotExpired(undefined, {
          time: closestExpireTime.expireTime.toISOString(),
        });
      }
    }
  }

  if (mode === "unDelegateResource" && resource && a.tronResources) {
    const delegatedResourceAmount = await getDelegatedResource(a, t, resource);
    if (delegatedResourceAmount.lt(t.amount)) {
      errors.resource = new TronInvalidUnDelegateResourceAmount();
    }
  }

  if (mode === "vote") {
    if (votes.length === 0) {
      errors.vote = new TronVoteRequired();
    } else {
      const superRepresentatives = await getTronSuperRepresentatives();
      const isValidVoteCounts = votes.every(v => v.voteCount > 0);
      const isValidAddresses = votes.every(v =>
        superRepresentatives.some(s => s.address === v.address),
      );

      if (!isValidAddresses) {
        errors.vote = new InvalidAddress("", {
          currencyName: a.currency.name,
        });
      } else if (!isValidVoteCounts) {
        errors.vote = new TronInvalidVoteCount();
      } else {
        const totalVoteCount = sumBy(votes, "voteCount");
        const tronPower = (a.tronResources && a.tronResources.tronPower) || 0;

        if (totalVoteCount > tronPower) {
          errors.vote = new TronNotEnoughTronPower();
        }
      }
    }
  }

  if (mode === "claimReward") {
    const lastRewardOp = account.operations.find(o => o.type === "REWARD");
    const claimableRewardDate = lastRewardOp
      ? new Date(lastRewardOp.date.getTime() + 24 * 60 * 60 * 1000) // date + 24 hours
      : new Date();

    if (a.tronResources && a.tronResources.unwithdrawnReward.eq(0)) {
      errors.reward = new TronNoReward();
    } else if (lastRewardOp && claimableRewardDate.valueOf() > new Date().valueOf()) {
      errors.reward = new TronRewardNotAvailable("Reward is not claimable", {
        until: claimableRewardDate.toISOString(),
      });
    }
  }

  const estimatedFees =
    Object.entries(errors).length > 0
      ? new BigNumber(0)
      : await getEstimatedFees(a, t, isContractAddressRecipient);
  const balance =
    account.type === "Account"
      ? BigNumber.max(0, account.spendableBalance.minus(estimatedFees))
      : account.balance;
  const amount = useAllAmount ? balance : t.amount;
  const amountSpent = ["send", "freeze", "undelegateResource"].includes(mode)
    ? amount
    : new BigNumber(0);

  if (mode === "freeze" && amount.lt(oneTrx)) {
    errors.amount = new TronInvalidFreezeAmount();
  }

  // fees are applied in the parent only (TRX)
  const totalSpent = account.type === "Account" ? amountSpent.plus(estimatedFees) : amountSpent;

  if (["send", "freeze"].includes(mode)) {
    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    }
    if (amountSpent.eq(0)) {
      errors.amount = useAllAmount ? new NotEnoughBalance() : new AmountRequired();
    } else if (amount.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    } else if (account.type === "TokenAccount" && estimatedFees.gt(a.balance)) {
      errors.amount = new NotEnoughBalance();
    }

    const energy = (a.tronResources && a.tronResources.energy) || new BigNumber(0);

    // For the moment, we rely on this rule:
    // Add a 'TronNotEnoughEnergy' warning only if the account sastifies theses 3 conditions:
    // - no energy
    // - balance is lower than 1 TRX
    // - contract consumes user energy (ie: user's ratio > 0%)
    if (
      account.type === "TokenAccount" &&
      account.token.tokenType === "trc20" &&
      energy.lt(47619) // temporary value corresponding to usdt trc20 energy
    ) {
      const contractUserEnergyConsumption = await getContractUserEnergyRatioConsumption(
        account.token.contractAddress,
      );

      if (contractUserEnergyConsumption > 0) {
        warnings.amount = new TronNotEnoughEnergy();
      }
    }
  }

  if (!errors.recipient && estimatedFees.gt(0)) {
    const fees = formatCurrencyUnit(getAccountUnit(a), estimatedFees, {
      showCode: true,
      disableRounding: true,
    });
    warnings.fee = new TronUnexpectedFees("Estimated fees", {
      fees,
    });
  }

  return Promise.resolve({
    errors,
    warnings,
    amount: amountSpent,
    estimatedFees,
    totalSpent,
    family,
  });
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const fees = await getEstimatedFees(
    mainAccount,
    {
      ...createTransaction(),
      subAccountId: account.type === "Account" ? null : account.id,
      ...transaction,
      recipient: transaction?.recipient || "0x0000000000000000000000000000000000000000",
      amount: new BigNumber(0),
    },
    transaction && transaction.recipient
      ? (await fetchTronContract(transaction.recipient)) !== undefined
      : false,
  );
  return account.type === "Account"
    ? BigNumber.max(0, account.spendableBalance.minus(fees))
    : account.balance;
};

const prepareTransaction = async (a, t: Transaction): Promise<Transaction> => {
  const networkInfo: NetworkInfo = t.networkInfo || (await getTronAccountNetwork(a.freshAddress));
  return t.networkInfo === networkInfo ? t : { ...t, networkInfo };
};

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
  prepareTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  sync,
  receive,
  signOperation,
  broadcast,
  assignFromAccountRaw,
  assignToAccountRaw,
};

export default {
  currencyBridge,
  accountBridge,
};
