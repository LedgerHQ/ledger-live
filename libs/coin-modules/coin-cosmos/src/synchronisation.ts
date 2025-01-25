import { BigNumber } from "bignumber.js";
import { encodeAccountId } from "@ledgerhq/coin-framework/account";
import {
  AccountShapeInfo,
  GetAccountShape,
  mergeOps,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { OperationType } from "@ledgerhq/types-live";
import { CosmosAPI } from "./api/Cosmos";
import { getMainMessage } from "./helpers";
import { parseAmountStringToNumber } from "./logic";
import { CosmosAccount, CosmosOperation, CosmosTx } from "./types";

export const getAccountShape: GetAccountShape<CosmosAccount> = async (info: any) => {
  const { address, currency, derivationMode, initialAccount } = info;
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const {
    accountInfo,
    balances,
    blockHeight,
    txs,
    delegations,
    redelegations,
    unbondings,
    withdrawAddress,
  } = await new CosmosAPI(currency.id).getAccountInfo(address, currency);

  const oldOperations = initialAccount?.operations || [];
  const newOperations = txToOps(info, accountId, txs);
  const operations = mergeOps(oldOperations, newOperations);
  let balance = balances;
  let delegatedBalance = new BigNumber(0);
  let pendingRewardsBalance = new BigNumber(0);
  let unbondingBalance = new BigNumber(0);

  for (const delegation of delegations) {
    delegatedBalance = delegatedBalance.plus(delegation.amount);
    balance = balance.plus(delegation.amount);

    pendingRewardsBalance = pendingRewardsBalance.plus(delegation.pendingRewards);
  }

  for (const unbonding of unbondings) {
    unbondingBalance = unbondingBalance.plus(unbonding.amount);
    balance = balance.plus(unbonding.amount);
  }

  let spendableBalance = balance.minus(unbondingBalance.plus(delegatedBalance));

  if (spendableBalance.lt(0)) {
    spendableBalance = new BigNumber(0);
  }

  const shape = {
    id: accountId,
    xpub: address,
    balance: balance,
    spendableBalance,
    operationsCount: operations.length,
    blockHeight,
    cosmosResources: {
      delegations,
      redelegations,
      unbondings,
      delegatedBalance,
      pendingRewardsBalance,
      unbondingBalance,
      withdrawAddress,
      sequence: accountInfo.sequence,
    },
  };

  if (shape.spendableBalance && shape.spendableBalance.lt(0)) {
    shape.spendableBalance = new BigNumber(0);
  }

  return { ...shape, operations };
};

const getBlankOperation = (tx: CosmosTx, fees: BigNumber, accountId: string): CosmosOperation => {
  return {
    id: "",
    hash: tx.txhash,
    type: "" as OperationType,
    value: new BigNumber(0),
    fee: fees,
    blockHash: null,
    blockHeight: parseInt(tx.height),
    senders: [] as string[],
    recipients: [] as string[],
    accountId,
    date: new Date(tx.timestamp),
    extra: {},
    transactionSequenceNumber: parseInt(tx?.tx?.auth_info?.signer_infos[0]?.sequence || "0"),
  };
};

const txToOps = (info: AccountShapeInfo, accountId: string, txs: CosmosTx[]): CosmosOperation[] => {
  const { address, currency } = info;
  const unitCode = currency.units[1].code;
  const ops: CosmosOperation[] = [];
  for (const tx of txs) {
    const amounts = tx?.tx?.auth_info?.fee?.amount;

    const fees = !amounts
      ? new BigNumber(0)
      : amounts.reduce((acc: BigNumber, curr: { denom: string; amount: string }) => {
          if (curr.denom === unitCode) {
            return acc.plus(curr.amount);
          }
          return acc;
        }, new BigNumber(0));

    const op: CosmosOperation = getBlankOperation(tx, fees, accountId);

    op.hasFailed = tx.code !== 0;

    // simplify the message types
    const messages = tx.tx.body.messages.map((message: any) => ({
      ...message,
      type: message["@type"].substring(message["@type"].lastIndexOf(".") + 1),
    }));
    const mainMessage = getMainMessage(messages);

    if (!mainMessage) {
      // happens when we don't know this message type in our implementation, example : proposal_vote
      continue;
    }

    const correspondingMessages = messages.filter((m: any) => m.type === mainMessage.type);

    switch (mainMessage.type) {
      case "MsgTransfer": {
        //IBC send
        for (const message of correspondingMessages) {
          const amount = message["token"].amount;
          const denom = message["token"].denom;
          const sender = message["sender"];
          const recipient = message["receiver"];
          if (!amount || !sender || !recipient || !denom || denom !== unitCode) {
            continue;
          }
          if (sender === address) {
            if (op.senders.indexOf(sender) === -1) op.senders.push(sender);
            if (op.recipients.indexOf(recipient) === -1) op.recipients.push(recipient);
            op.value = op.value.plus(new BigNumber(amount));
            op.type = "OUT";
          }
        }
        if (op.type === "OUT") {
          op.value = op.value.plus(fees);
        }
        break;
      }
      case "MsgRecvPacket": {
        //IBC receive
        for (const message of tx.events) {
          if (message.type === "fungible_token_packet") {
            const sender = message.attributes.find(attr => attr.key === "sender")?.value;
            const receiver = message.attributes.find(attr => attr.key === "receiver")?.value;
            const amount = message.attributes.find(attr => attr.key === "amount")?.value;
            const denom = message.attributes.find(attr => attr.key === "denom")?.value;
            if (sender && receiver === address && amount && denom && denom.endsWith(unitCode)) {
              if (op.senders.indexOf(sender) === -1) op.senders.push(sender);
              if (op.recipients.indexOf(receiver) === -1) op.recipients.push(receiver);
              const amountString = parseAmountStringToNumber(amount, unitCode);
              op.value = op.value.plus(new BigNumber(amountString));
              op.type = "IN";
            }
          }
        }
        break;
      }
      case "MsgSend": {
        for (const message of correspondingMessages) {
          const amount = message["amount"].find((amount: any) => amount.denom === unitCode);
          const sender = message["from_address"];
          const recipient = message["to_address"];
          if (!amount || !sender || !recipient) {
            continue;
          }
          if (op.senders.indexOf(sender) === -1) op.senders.push(sender);
          if (op.recipients.indexOf(recipient) === -1) op.recipients.push(recipient);
          op.value = op.value.plus(amount.amount);
          if (sender === address) {
            op.type = "OUT";
          } else if (recipient === address) {
            op.type = "IN";
          }
        }
        if (op.type === "OUT") {
          op.value = op.value.plus(fees);
        }
        break;
      }
      case "MsgWithdrawDelegatorReward": {
        op.type = "REWARD";
        const rewardShards: { amount: BigNumber; address: string }[] = [];
        let txRewardValue = new BigNumber(0);
        for (const message of tx.events) {
          const validator = message.attributes.find(attr => attr.key === "validator")?.value;
          const amount = message.attributes.find(attr => attr.key === "amount")?.value;
          if (validator && amount && amount.endsWith(unitCode)) {
            const amountString = parseAmountStringToNumber(amount, unitCode);
            rewardShards.push({
              amount: new BigNumber(amountString),
              address: validator,
            });
            txRewardValue = txRewardValue.plus(amountString);
          }
        }
        op.value = txRewardValue;
        op.extra.validators = rewardShards;
        break;
      }
      case "MsgDelegate": {
        op.type = "DELEGATE";
        op.value = new BigNumber(fees);
        const delegateShards: { amount: BigNumber; address: string }[] = [];
        for (const message of correspondingMessages) {
          const amount = message.amount;
          const validator = message["validator_address"];
          const delegator = message["delegator_address"];
          if (amount && validator && amount.denom === unitCode && delegator === address) {
            delegateShards.push({
              amount: new BigNumber(amount.amount),
              address: validator,
            });
          }
        }
        op.extra.validators = delegateShards;
        break;
      }
      case "MsgBeginRedelegate": {
        op.type = "REDELEGATE";
        op.value = new BigNumber(fees);
        const redelegateShards: { amount: BigNumber; address: string }[] = [];
        for (const message of correspondingMessages) {
          const amount = message["amount"];
          const validatorDst = message["validator_dst_address"];
          const validatorSrc = message["validator_src_address"];
          if (amount && validatorDst && validatorSrc && amount.denom === unitCode) {
            op.extra.sourceValidator = validatorSrc;
            redelegateShards.push({
              amount: new BigNumber(amount.amount),
              address: validatorDst,
            });
          }
        }
        op.extra.validators = redelegateShards;
        break;
      }
      case "MsgUndelegate": {
        op.type = "UNDELEGATE";
        op.value = new BigNumber(fees);
        const unbondShards: { amount: BigNumber; address: string }[] = [];
        for (const message of correspondingMessages) {
          const amount = message["amount"];
          const validator = message["validator_address"];
          if (amount && validator && amount.denom === unitCode) {
            unbondShards.push({
              amount: new BigNumber(amount.amount),
              address: validator,
            });
          }
        }
        op.extra.validators = unbondShards;
        break;
      }
    }

    if (tx.tx.body.memo != null) {
      op.extra.memo = tx.tx.body.memo;
    }
    op.id = encodeOperationId(accountId, tx.txhash, op.type);

    if (op.type) {
      ops.push(op);
    }
  }

  return ops;
};
