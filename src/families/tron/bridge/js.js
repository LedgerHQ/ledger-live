// @flow
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import flatMap from "lodash/flatMap";
import compact from "lodash/compact";
import get from "lodash/get";
import sumBy from "lodash/sumBy";
import type {
  Account,
  Operation,
  TokenAccount,
  SubAccount,
  TransactionStatus
} from "../../../types";
import type { NetworkInfo, Transaction } from "../types";
import {
  isParentTx,
  txInfoToOperation,
  getOperationTypefromMode,
  getEstimatedBlockSize
} from "../utils";
import type { CurrencyBridge, AccountBridge } from "../../../types/bridge";
import { findTokenById } from "../../../data/tokens";
import { open } from "../../../hw";
import signTransaction from "../../../hw/signTransaction";
import { makeSync, makeScanAccounts } from "../../../bridge/jsHelpers";
import { formatCurrencyUnit } from "../../../currencies";
import { getAccountUnit } from "../../../account";
import {
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecipientRequired,
  NotEnoughBalance,
  AmountRequired
} from "@ledgerhq/errors";
import {
  NoFrozenForBandwidth,
  NoFrozenForEnergy,
  UnfreezeNotExpired,
  VoteRequired,
  InvalidVoteCount,
  InvalidFreezeAmount,
  RewardNotAvailable,
  NoReward,
  SendTrc20ToNewAccountForbidden,
  UnexpectedFees,
  NotEnoughTronPower
} from "../../../errors";
import {
  broadcastTron,
  claimRewardTronTransaction,
  createTronTransaction,
  extractBandwidthInfo,
  fetchTronAccount,
  fetchTronAccountTxs,
  getTronAccountNetwork,
  getTronResources,
  getTronSuperRepresentatives,
  hydrateSuperRepresentatives,
  validateAddress,
  freezeTronTransaction,
  unfreezeTronTransaction,
  voteTronSuperRepresentatives
} from "../../../api/Tron";

const signOperation = ({ account, transaction, deviceId }) =>
  Observable.create(o => {
    async function main() {
      const subAccount =
        transaction.subAccountId && account.subAccounts
          ? account.subAccounts.find(sa => sa.id === transaction.subAccountId)
          : null;

      // send trc20 to a new account is forbidden by us (because it will not activate the account)
      if (
        transaction.recipient &&
        transaction.mode === "send" &&
        subAccount &&
        subAccount.type === "TokenAccount" &&
        subAccount.token.tokenType === "trc20" &&
        (await fetchTronAccount(transaction.recipient)).length === 0
      ) {
        throw new SendTrc20ToNewAccountForbidden();
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
          default:
            return createTronTransaction(account, transaction, subAccount);
        }
      };

      const preparedTransaction = await getPreparedTransaction();
      const transport = await open(deviceId);

      try {
        o.next({ type: "device-signature-requested" });

        // Sign by device
        const signature = await signTransaction(
          account.currency,
          transport,
          account.freshAddressPath,
          {
            rawDataHex: preparedTransaction.raw_data_hex,
            // only for trc10, we need to put the assetName hex message
            assetName:
              subAccount &&
              subAccount.type === "TokenAccount" &&
              subAccount.token.id.includes("trc10")
                ? subAccount.token.ledgerSignature
                : undefined
          }
        );

        o.next({ type: "device-signature-granted" });

        const hash = preparedTransaction.txID;

        const fee = await getEstimatedFees(account, transaction);

        const value =
          transaction.mode === "send" ? transaction.amount : BigNumber(0);

        const operationType = getOperationTypefromMode(transaction.mode);

        const operation = {
          id: `${account.id}-${hash}-${operationType}`,
          hash,
          accountId: account.id,
          type: operationType,
          value,
          fee,
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: [transaction.recipient],
          date: new Date(),
          extra: {}
        };

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
            signatureRaw: preparedTransaction.raw_data,
            expirationDate: null
          }
        });
      } finally {
        transport.close();
      }
    }

    main().then(
      () => o.complete(),
      e => o.error(e)
    );
  });

const broadcast = async ({
  signedOperation: { signature, operation, signatureRaw }
}) => {
  const transaction = {
    raw_data: signatureRaw,
    txID: operation.hash,
    signature: [signature]
  };

  const submittedTransaction = await broadcastTron(transaction);

  if (submittedTransaction.result !== true) {
    throw new Error(submittedTransaction.resultMessage);
  }

  return operation;
};

const getAccountShape = async info => {
  const tronAcc = await fetchTronAccount(info.address);

  if (tronAcc.length === 0) {
    return { balance: BigNumber(0) };
  }

  const acc = tronAcc[0];
  const spendableBalance = acc.balance ? BigNumber(acc.balance) : BigNumber(0);

  const txs = await fetchTronAccountTxs(info.address, txs => txs.length < 1000);

  const tronResources = await getTronResources(acc, txs);

  const balance = spendableBalance
    .plus(
      tronResources.frozen.bandwidth
        ? tronResources.frozen.bandwidth.amount
        : BigNumber(0)
    )
    .plus(
      tronResources.frozen.energy
        ? tronResources.frozen.energy.amount
        : BigNumber(0)
    )
    .plus(
      tronResources.delegatedFrozen.bandwidth
        ? tronResources.delegatedFrozen.bandwidth.amount
        : BigNumber(0)
    )
    .plus(
      tronResources.delegatedFrozen.energy
        ? tronResources.delegatedFrozen.energy.amount
        : BigNumber(0)
    );

  const parentTxs = txs.filter(isParentTx);
  const parentOperations: Operation[] = compact(
    parentTxs.map(tx => txInfoToOperation(info.id, info.address, tx))
  );

  const trc10Tokens = get(acc, "assetV2", []).map(({ key, value }) => ({
    type: "trc10",
    key,
    value
  }));

  const trc20Tokens = get(acc, "trc20", []).map(obj => {
    const [[key, value]] = Object.entries(obj);
    return { type: "trc20", key, value };
  });

  // TRC10 and TRC20 accounts
  const subAccounts: SubAccount[] = compact(
    trc10Tokens.concat(trc20Tokens).map(({ type, key, value }) => {
      const token = findTokenById(`tron/${type}/${key}`);
      if (!token) return;
      const id = info.id + "+" + key;
      const tokenTxs = txs.filter(tx => tx.tokenId === key);
      const operations = compact(
        tokenTxs.map(tx => txInfoToOperation(id, info.address, tx))
      );
      const sub: TokenAccount = {
        type: "TokenAccount",
        id,
        starred: false,
        parentId: info.id,
        token,
        balance: BigNumber(value),
        operationsCount: operations.length,
        operations,
        pendingOperations: []
      };
      return sub;
    })
  );

  // get 'OUT' token operations with fee
  const subOutOperationsWithFee: Operation[] = flatMap(
    subAccounts.map(s => s.operations)
  )
    .filter(o => o.type === "OUT" && o.fee.isGreaterThan(0))
    .map(o => ({ ...o, accountId: info.id, value: o.fee }));

  // add them to the parent operations and sort by date desc
  const parentOpsAndSubOutOpsWithFee = parentOperations
    .concat(subOutOperationsWithFee)
    .sort((a, b) => b.date - a.date);

  return {
    balance,
    spendableBalance,
    operationsCount: parentOpsAndSubOutOpsWithFee.length,
    operations: parentOpsAndSubOutOpsWithFee,
    subAccounts,
    tronResources
  };
};

const scanAccounts = makeScanAccounts(getAccountShape);

const sync = makeSync(getAccountShape);

const currencyBridge: CurrencyBridge = {
  preload: async () => {
    const superRepresentatives = await getTronSuperRepresentatives();
    return { superRepresentatives };
  },
  hydrate: (data: mixed) => {
    if (!data || typeof data !== "object") return;
    const { superRepresentatives } = data;
    if (
      !superRepresentatives ||
      typeof superRepresentatives !== "object" ||
      !Array.isArray(superRepresentatives)
    )
      return;
    hydrateSuperRepresentatives(superRepresentatives);
  },
  scanAccounts
};

const createTransaction = () => ({
  family: "tron",
  amount: BigNumber(0),
  mode: "send",
  duration: 3,
  recipient: "",
  networkInfo: null,
  resource: null,
  votes: []
});

const updateTransaction = (t, patch) => ({ ...t, ...patch });

// see : https://developers.tron.network/docs/bandwith#section-bandwidth-points-consumption
// 1. cost around 200 Bandwidth, if not enough check Free Bandwidth
// 2. If not enough, will cost some TRX
// 3. normal transfert cost around 0.002 TRX
const getFeesFromBandwidth = (a: Account, t: Transaction): BigNumber => {
  const { freeUsed, freeLimit, gainedUsed, gainedLimit } = extractBandwidthInfo(
    t.networkInfo
  );
  const available = freeLimit - freeUsed + gainedLimit - gainedUsed;

  const estimatedBandwidthCost = getEstimatedBlockSize(a, t);

  if (available < estimatedBandwidthCost) {
    return BigNumber(2000); // cost is around 0.002 TRX
  }

  return BigNumber(0); // no fee
};

// Special case: If activated an account, cost around 0.1 TRX
const getFeesFromAccountActivation = async (
  a: Account,
  t: Transaction
): Promise<BigNumber> => {
  const recipientAccount = await fetchTronAccount(t.recipient);
  const { gainedUsed, gainedLimit } = extractBandwidthInfo(t.networkInfo);
  const available = gainedLimit - gainedUsed;

  const estimatedBandwidthCost = getEstimatedBlockSize(a, t);

  if (recipientAccount.length === 0 && available < estimatedBandwidthCost) {
    return BigNumber(100000); // cost is around 0.1 TRX
  }

  return BigNumber(0); // no fee
};

const getEstimatedFees = async (a: Account, t: Transaction) => {
  const feesFromAccountActivation =
    t.mode === "send" ? await getFeesFromAccountActivation(a, t) : BigNumber(0);

  if (feesFromAccountActivation.gt(0)) {
    return feesFromAccountActivation;
  }

  const feesFromBandwidth = getFeesFromBandwidth(a, t);
  return feesFromBandwidth;
};

const getTransactionStatus = async (
  a: Account,
  t: Transaction
): Promise<TransactionStatus> => {
  const errors: { [string]: Error } = {};
  const warnings: { [string]: Error } = {};

  const { mode, amount, recipient, resource, votes } = t;

  const tokenAccount = !t.subAccountId
    ? null
    : a.subAccounts && a.subAccounts.find(ta => ta.id === t.subAccountId);

  const account = tokenAccount || a;

  const balance =
    account.type === "Account" ? account.spendableBalance : account.balance;

  if (mode === "send" && !recipient) {
    errors.recipient = new RecipientRequired();
  }

  if (["send", "freeze", "unfreeze"].includes(mode)) {
    if (recipient === a.freshAddress) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    } else if (recipient && !(await validateAddress(recipient))) {
      errors.recipient = new InvalidAddress(null, {
        currencyName: a.currency.name
      });
    } else if (
      recipient &&
      mode === "send" &&
      account.type === "TokenAccount" &&
      account.token.tokenType === "trc20" &&
      (await fetchTronAccount(recipient)).length === 0
    ) {
      // send trc20 to a new account is forbidden by us (because it will not activate the account)
      errors.recipient = new SendTrc20ToNewAccountForbidden();
    }
  }

  if (mode === "freeze" && amount.lt(BigNumber(1000000))) {
    errors.amount = new InvalidFreezeAmount();
  }

  if (mode === "unfreeze") {
    const lowerCaseResource = resource ? resource.toLowerCase() : "bandwidth";
    const now = new Date();
    const expiredDatePath = recipient
      ? `tronResources.delegatedFrozen.${lowerCaseResource}.expiredAt`
      : `tronResources.frozen.${lowerCaseResource}.expiredAt`;

    const expirationDate: ?Date = get(a, expiredDatePath, undefined);

    if (!expirationDate) {
      if (resource === "BANDWIDTH") {
        errors.resource = new NoFrozenForBandwidth();
      } else {
        errors.resource = new NoFrozenForEnergy();
      }
    } else if (now.getTime() < expirationDate.getTime()) {
      errors.resource = new UnfreezeNotExpired(null, {
        until: expirationDate.toISOString()
      });
    }
  }

  if (mode === "vote") {
    if (votes.length === 0) {
      errors.vote = new VoteRequired();
    } else {
      const superRepresentatives = await getTronSuperRepresentatives();
      const isValidVoteCounts = votes.every(v => v.voteCount > 0);
      const isValidAddresses = votes.every(v =>
        superRepresentatives.some(s => s.address === v.address)
      );

      if (!isValidAddresses) {
        errors.vote = new InvalidAddress();
      } else if (!isValidVoteCounts) {
        errors.vote = new InvalidVoteCount();
      } else {
        const totalVoteCount = sumBy(votes, "voteCount");
        const tronPower = (a.tronResources && a.tronResources.tronPower) || 0;
        if (totalVoteCount > tronPower) {
          errors.vote = new NotEnoughTronPower();
        }
      }
    }
  }

  if (mode === "claimReward") {
    const lastRewardOp = account.operations.find(o => o.type === "REWARD");
    const claimableRewardDate = lastRewardOp
      ? new Date(lastRewardOp.date.getTime() + 24 * 60 * 60 * 1000) // date + 24 hours
      : new Date();

    if (a.tronResources && a.tronResources.unwithdrawnReward === 0) {
      errors.reward = new NoReward();
    } else if (lastRewardOp && claimableRewardDate > new Date().getTime()) {
      errors.reward = new RewardNotAvailable("Reward is not claimable", {
        until: claimableRewardDate.toISOString()
      });
    }
  }

  const amountSpent = ["send", "freeze"].includes(mode) ? amount : BigNumber(0);

  const estimatedFees =
    Object.entries(errors).length > 0
      ? BigNumber(0)
      : await getEstimatedFees(a, t);

  // fees are applied in the parent only (TRX)
  const totalSpent =
    account.type === "Account" ? amountSpent.plus(estimatedFees) : amountSpent;

  if (!errors.recipient && ["send", "freeze"].includes(mode)) {
    if (amountSpent.eq(0)) {
      errors.amount = new AmountRequired();
    } else if (totalSpent.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    } else if (account.type === "TokenAccount" && estimatedFees.gt(a.balance)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  if (!errors.recipient && estimatedFees.gt(0)) {
    const fees = formatCurrencyUnit(getAccountUnit(a), estimatedFees, {
      showCode: true,
      disableRounding: true
    });

    warnings.fee = new UnexpectedFees("Estimated fees", { fees });
  }

  return Promise.resolve({
    errors,
    warnings,
    amount: amountSpent,
    estimatedFees,
    totalSpent
  });
};

const prepareTransaction = async (a, t: Transaction): Promise<Transaction> => {
  const networkInfo: NetworkInfo =
    t.networkInfo || (await getTronAccountNetwork(a.freshAddress));

  return t.networkInfo === networkInfo ? t : { ...t, networkInfo };
};

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  sync,
  signOperation,
  broadcast
};

export default { currencyBridge, accountBridge };
