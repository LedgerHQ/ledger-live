import { Operation, OperationType } from "../../types";
import { BigNumber } from "bignumber.js";
import {
  makeSync,
  makeScanAccounts,
  GetAccountShape,
  mergeOps,
} from "../../bridge/jsHelpers";
import { encodeAccountId } from "../../account";
import { getAccountInfo } from "./api/Cosmos";
import { pubkeyToAddress, decodeBech32Pubkey } from "@cosmjs/amino";
import { encodeOperationId } from "../../operation";
import { CosmosDelegationInfo } from "./types";

const txToOps = (info: any, id: string, txs: any): Operation[] => {
  const { address, currency } = info;
  const ops: Operation[] = [];

  for (const tx of txs) {
    let fees = new BigNumber(0);

    tx.tx.auth_info.fee.amount.forEach((elem) => {
      if (elem.denom === currency.units[1].code) fees = fees.plus(elem.amount);
    });

    const op: Operation = {
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
      transactionSequenceNumber: parseInt(
        tx.tx.auth_info.signer_infos[0].sequence
      ),
    };

    tx.logs.forEach((log) => {
      log.events.forEach((message) => {
        // parse attributes as key:value
        const attributes: { [id: string]: any } = {};
        message.attributes.forEach(
          (item) => (attributes[item.key] = item.value)
        );

        // https://docs.cosmos.network/v0.42/modules/staking/07_events.html
        switch (message.type) {
          case "transfer":
            if (
              attributes.sender &&
              attributes.recipient &&
              attributes.amount
            ) {
              op.senders.push(attributes.sender);
              op.recipients.push(attributes.recipient);

              if (attributes.amount.indexOf(currency.units[1].code) != -1) {
                op.value = op.value.plus(
                  attributes.amount.replace(currency.units[1].code, "")
                );
              }

              if (!op.type && attributes.sender === address) {
                op.type = "OUT";
                op.value = op.value.plus(fees);
              } else if (!op.type && attributes.recipient === address) {
                op.type = "IN";
              }
            }
            break;

          case "withdraw_rewards":
            if (
              (attributes.amount &&
                attributes.amount.indexOf(currency.units[1].code) != -1) ||
              // handle specifc case with empty amount value like
              // tx DF458FE6A82C310837D7A33735FA5298BCF71B0BFF7A4134641AAE30F6F1050
              attributes.amount === ""
            ) {
              op.type = "REWARD";
              op.value = new BigNumber(fees);
              op.extra.validators.push({
                address: attributes.validator,
                amount:
                  attributes.amount.replace(currency.units[1].code, "") || 0,
              });
            }
            break;

          case "delegate":
            if (
              attributes.amount &&
              attributes.amount.indexOf(currency.units[1].code) != -1
            ) {
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
              op.extra.cosmosSourceValidator = attributes.source_validator;
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
      });
    });

    if (!["IN", "OUT"].includes(op.type)) {
      op.senders = [];
      op.recipients = [];
    }

    op.id = encodeOperationId(id, tx.txhash, op.type);

    if (op.type) {
      ops.push(op);
    }
  }

  return ops;
};

export const getAccountShape: GetAccountShape = async (info) => {
  const { address, currency, derivationMode, initialAccount } = info;
  let xpubOrAddress = address;

  if (address.match("cosmospub")) {
    const pubkey = decodeBech32Pubkey(address);
    xpubOrAddress = pubkeyToAddress(pubkey as any, "cosmos");
  }

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress,
    derivationMode,
  });

  const {
    balances,
    blockHeight,
    txs,
    delegations,
    redelegations,
    unbondings,
    withdrawAddress,
  } = await getAccountInfo(xpubOrAddress, currency);

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

    pendingRewardsBalance = pendingRewardsBalance.plus(
      delegation.pendingRewards
    );
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
    xpub: xpubOrAddress,
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
