import { BigNumber } from "bignumber.js";
import {
  makeSync,
  makeScanAccounts,
  GetAccountShape,
  mergeOps,
  AccountShapeInfo,
} from "../../bridge/jsHelpers";
import { encodeAccountId } from "../../account";
import { CosmosAPI } from "./api/Cosmos";
import { encodeOperationId } from "../../operation";
import { CosmosDelegationInfo, CosmosMessage, CosmosTx } from "./types";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { getMainMessage } from "./helpers";

const getBlankOperation = (tx, fees, id) => ({
  id: "",
  hash: tx.txhash,
  type: "" as OperationType,
  value: new BigNumber(0),
  fee: fees,
  blockHash: null,
  blockHeight: tx.height,
  senders: [] as string[],
  recipients: [] as string[],
  accountId: id,
  date: new Date(tx.timestamp),
  extra: {
    validators: [] as CosmosDelegationInfo[],
  },
  transactionSequenceNumber: parseInt(tx.tx.auth_info.signer_infos[0].sequence),
});

const txToOps = (info: AccountShapeInfo, accountId: string, txs: CosmosTx[]): Operation[] => {
  const { address, currency } = info;
  const ops: Operation[] = [];
  for (const tx of txs) {
    let fees = new BigNumber(0);

    tx.tx.auth_info.fee.amount.forEach(elem => {
      if (elem.denom === currency.units[1].code) fees = fees.plus(elem.amount);
    });

    const op: Operation = getBlankOperation(tx, fees, accountId);

    const messages: CosmosMessage[] = tx.logs.map(log => log.events).flat(1);

    const mainMessage = getMainMessage(messages);

    if (mainMessage === undefined) {
      // happens when we don't know this message type in our implementation, example : proposal_vote
      continue;
    }

    const correspondingMessages = messages.filter(m => m.type === mainMessage.type);

    if (correspondingMessages.length === 0) {
      continue;
    }

    // TODO: This mechanism should be removed
    const attributes: { [id: string]: any } = {};
    mainMessage.attributes.forEach(item => (attributes[item.key] = item.value));

    // https://docs.cosmos.network/v0.42/modules/staking/07_events.html
    switch (mainMessage.type) {
      case "transfer":
        if (attributes.sender && attributes.recipient && attributes.amount) {
          op.senders.push(attributes.sender);
          op.recipients.push(attributes.recipient);

          if (attributes.amount.indexOf(currency.units[1].code) != -1) {
            op.value = op.value.plus(attributes.amount.replace(currency.units[1].code, ""));
          }

          if (!op.type && attributes.sender === address) {
            op.type = "OUT";
            op.value = op.value.plus(fees);
          } else if (!op.type && attributes.recipient === address) {
            op.type = "IN";
          }
        }
        break;

      case "withdraw_rewards": {
        op.type = "REWARD";

        const rewardShards: { amount: BigNumber; address: string }[] = [];

        let txRewardValue = new BigNumber(0);

        for (const message of correspondingMessages) {
          const validatorAttribute = message.attributes.find(attr => attr.key === "validator");

          if (validatorAttribute == null) {
            continue;
          }

          const validatorAddress = validatorAttribute.value;

          let messageRewardValue = new BigNumber(0);
          const amountAttributes = message.attributes.filter(
            attribute =>
              attribute.key === "amount" && attribute.value.includes(currency.units[1].code),
          );

          amountAttributes.forEach(amountAttribute => {
            messageRewardValue = messageRewardValue.plus(
              new BigNumber(amountAttribute.value.replace(currency.units[1].code, "")),
            );
          });

          rewardShards.push({
            amount: messageRewardValue,
            address: validatorAddress,
          });

          txRewardValue = txRewardValue.plus(messageRewardValue);
        }

        op.value = txRewardValue;
        op.extra.validators = rewardShards;

        break;
      }

      case "delegate":
        if (attributes.amount && attributes.amount.indexOf(currency.units[1].code) != -1) {
          op.type = "DELEGATE";
          op.value = new BigNumber(fees);
          op.extra.validators.push({
            address: attributes.validator,
            amount: attributes.amount.replace(currency.units[1].code, ""),
          });
        }
        break;

      case "redelegate":
        if (
          attributes.amount &&
          attributes.amount.indexOf(currency.units[1].code) != -1 &&
          attributes.destination_validator &&
          attributes.source_validator
        ) {
          op.type = "REDELEGATE";
          op.value = new BigNumber(fees);
          op.extra.validators.push({
            address: attributes.destination_validator,
            amount: attributes.amount.replace(currency.units[1].code, ""),
          });
          op.extra.sourceValidator = attributes.source_validator;
        }
        break;

      case "unbond":
        if (
          attributes.amount &&
          attributes.amount.indexOf(currency.units[1].code) != -1 &&
          attributes.validator
        ) {
          op.type = "UNDELEGATE";
          op.value = new BigNumber(fees);
          op.extra.validators.push({
            address: attributes.validator,
            amount: attributes.amount.replace(currency.units[1].code, ""),
          });
        }
        break;
    }

    if (tx.tx.body.memo != null) {
      op.extra.memo = tx.tx.body.memo;
    }

    // Dirty, to remove after attributes map is gone
    if (!["IN", "OUT"].includes(op.type)) {
      op.senders = [];
      op.recipients = [];
    }

    op.id = encodeOperationId(accountId, tx.txhash, op.type);

    if (op.type) {
      ops.push(op);
    }
  }

  return ops;
};

export const getAccountShape: GetAccountShape = async info => {
  const { address, currency, derivationMode, initialAccount } = info;
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const { balances, blockHeight, txs, delegations, redelegations, unbondings, withdrawAddress } =
    await new CosmosAPI(currency.id).getAccountInfo(address, currency);
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
    },
  };

  if (shape.spendableBalance && shape.spendableBalance.lt(0)) {
    shape.spendableBalance = new BigNumber(0);
  }

  return { ...shape, operations };
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });
