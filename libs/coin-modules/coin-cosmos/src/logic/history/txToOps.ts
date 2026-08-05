import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { BigNumber } from "bignumber.js";
import { getMainMessage } from "../../helpers";
import { parseAmountStringToNumber } from "../../logic";
import { CosmosDelegationInfo, CosmosOperation, CosmosOperationExtra, CosmosTx } from "../../types";

type CosmosOperationType = "IN" | "OUT" | "DELEGATE" | "UNDELEGATE" | "REDELEGATE" | "REWARD";

/** Cosmos-specific op details carried through the parser — no `@types/live` `OperationExtra`. */
type CosmosParsedExtra = {
  validators?: CosmosDelegationInfo[];
  sourceValidator?: string;
  memo?: string;
};

/**
 * Framework-neutral parse of a Cosmos tx — no `@types/live` `Operation`, no accountId, no
 * Ledger-Wallet operation id. The Alpaca `listOperations` consumes this directly; the bridge wraps
 * it via {@link txToOps}.
 */
export type CosmosParsedOperation = {
  hash: string;
  type: CosmosOperationType;
  value: BigNumber;
  fee: BigNumber;
  blockHash: null;
  blockHeight: number;
  senders: string[];
  recipients: string[];
  date: Date;
  extra: CosmosParsedExtra;
  transactionSequenceNumber: BigNumber;
  hasFailed: boolean;
};

const pushUnique = (arr: string[], value: string): void => {
  if (!arr.includes(value)) arr.push(value);
};

const computeFees = (
  amounts: { denom: string; amount: string }[] | undefined,
  unitCode: string,
): BigNumber => {
  if (!amounts) return new BigNumber(0);
  return amounts.reduce((acc: BigNumber, curr: { denom: string; amount: string }) => {
    if (curr.denom === unitCode) {
      return acc.plus(curr.amount);
    }
    return acc;
  }, new BigNumber(0));
};

const simplifyMessages = (messages: any[]): any[] =>
  messages.map((message: any) => {
    const type = message["@type"].substring(message["@type"].lastIndexOf(".") + 1);
    // babylon x/epoching nests the real staking msg under `msg` (MsgWrapped*); unwrap so the
    // standard delegate/undelegate/redelegate handling below applies.
    if (message["@type"].startsWith("/babylon.epoching.") && message.msg) {
      return { ...message.msg, type: type.replace("Wrapped", "") };
    }
    return { ...message, type };
  });

const handleMsgTransfer = (
  op: CosmosParsedOperation,
  correspondingMessages: any[],
  address: string,
  unitCode: string,
  fees: BigNumber,
): void => {
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
      pushUnique(op.senders, sender);
      pushUnique(op.recipients, recipient);
      op.value = op.value.plus(new BigNumber(amount));
      op.type = "OUT";
    }
  }
  if (op.type === "OUT") {
    op.value = op.value.plus(fees);
  }
};

const handleMsgRecvPacket = (
  op: CosmosParsedOperation,
  tx: CosmosTx,
  address: string,
  unitCode: string,
): void => {
  //IBC receive
  for (const message of tx.events) {
    if (message.type !== "fungible_token_packet") {
      continue;
    }
    const sender = message.attributes.find(attr => attr.key === "sender")?.value;
    const receiver = message.attributes.find(attr => attr.key === "receiver")?.value;
    const amount = message.attributes.find(attr => attr.key === "amount")?.value;
    const denom = message.attributes.find(attr => attr.key === "denom")?.value;
    if (sender && receiver === address && amount && denom?.endsWith(unitCode)) {
      pushUnique(op.senders, sender);
      pushUnique(op.recipients, receiver);
      const amountString = parseAmountStringToNumber(amount, unitCode);
      op.value = op.value.plus(new BigNumber(amountString));
      op.type = "IN";
    }
  }
};

const handleMsgSend = (
  op: CosmosParsedOperation,
  correspondingMessages: any[],
  address: string,
  unitCode: string,
  fees: BigNumber,
): void => {
  for (const message of correspondingMessages) {
    const amount = message["amount"].find((amount: any) => amount.denom === unitCode);
    const sender = message["from_address"];
    const recipient = message["to_address"];
    if (!amount || !sender || !recipient) {
      continue;
    }
    pushUnique(op.senders, sender);
    pushUnique(op.recipients, recipient);
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
};

const handleMsgWithdrawDelegatorReward = (
  op: CosmosParsedOperation,
  tx: CosmosTx,
  unitCode: string,
): void => {
  op.type = "REWARD";
  const rewardShards: { amount: BigNumber; address: string }[] = [];
  let txRewardValue = new BigNumber(0);
  for (const message of tx.events) {
    const validator = message.attributes.find(attr => attr.key === "validator")?.value;
    const amount = message.attributes.find(attr => attr.key === "amount")?.value;
    if (validator && amount?.endsWith(unitCode)) {
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
};

const handleMsgDelegate = (
  op: CosmosParsedOperation,
  correspondingMessages: any[],
  address: string,
  unitCode: string,
  fees: BigNumber,
): void => {
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
};

const handleMsgBeginRedelegate = (
  op: CosmosParsedOperation,
  correspondingMessages: any[],
  unitCode: string,
  fees: BigNumber,
): void => {
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
};

const handleMsgUndelegate = (
  op: CosmosParsedOperation,
  correspondingMessages: any[],
  unitCode: string,
  fees: BigNumber,
): void => {
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
};

const getBlankOperation = (tx: CosmosTx, fees: BigNumber): CosmosParsedOperation => {
  return {
    hash: tx.txhash,
    type: "" as CosmosOperationType,
    value: new BigNumber(0),
    fee: fees,
    blockHash: null,
    blockHeight: Number.parseInt(tx.height, 10),
    senders: [] as string[],
    recipients: [] as string[],
    date: new Date(tx.timestamp),
    extra: {},
    transactionSequenceNumber: new BigNumber(tx?.tx?.auth_info?.signer_infos?.[0]?.sequence || "0"),
    hasFailed: false,
  };
};

/**
 * Parse raw Cosmos txs into the framework-neutral {@link CosmosParsedOperation} shape. Owned by the
 * logic layer and consumed directly by the Alpaca `listOperations`; the bridge goes through
 * {@link txToOps}. `info` is framework-neutral (`{ address, unitCode }`) — no bridge types.
 */
export const parseCosmosOperations = (
  info: { address: string; unitCode: string },
  txs: CosmosTx[],
): CosmosParsedOperation[] => {
  const { address, unitCode } = info;
  const ops: CosmosParsedOperation[] = [];
  for (const tx of txs) {
    const fees = computeFees(tx?.tx?.auth_info?.fee?.amount, unitCode);

    const op: CosmosParsedOperation = getBlankOperation(tx, fees);

    op.hasFailed = tx.code !== 0;

    const messages = simplifyMessages(tx.tx.body.messages);
    const mainMessage = getMainMessage(messages);

    if (!mainMessage) {
      // happens when we don't know this message type in our implementation, example : proposal_vote
      continue;
    }

    const correspondingMessages = messages.filter((m: any) => m.type === mainMessage.type);

    switch (mainMessage.type) {
      case "MsgTransfer":
        handleMsgTransfer(op, correspondingMessages, address, unitCode, fees);
        break;
      case "MsgRecvPacket":
        handleMsgRecvPacket(op, tx, address, unitCode);
        break;
      case "MsgSend":
        handleMsgSend(op, correspondingMessages, address, unitCode, fees);
        break;
      case "MsgWithdrawDelegatorReward":
        handleMsgWithdrawDelegatorReward(op, tx, unitCode);
        break;
      case "MsgDelegate":
        handleMsgDelegate(op, correspondingMessages, address, unitCode, fees);
        break;
      case "MsgBeginRedelegate":
        handleMsgBeginRedelegate(op, correspondingMessages, unitCode, fees);
        break;
      case "MsgUndelegate":
        handleMsgUndelegate(op, correspondingMessages, unitCode, fees);
        break;
    }

    if (tx.tx.body.memo !== null && tx.tx.body.memo !== undefined) {
      op.extra.memo = tx.tx.body.memo;
    }

    if (op.type) {
      ops.push(op);
    }
  }

  return ops;
};

/**
 * Bridge adapter: wrap {@link parseCosmosOperations} results into the `@types/live`-derived
 * {@link CosmosOperation} the account/transaction bridge stores. The Ledger-Wallet operation id and
 * accountId live only here — the Alpaca path never sees them (it consumes the neutral parser).
 */
export const txToOps = (
  info: { address: string; unitCode: string },
  accountId: string,
  txs: CosmosTx[],
): CosmosOperation[] =>
  parseCosmosOperations(info, txs).map(op => {
    const cosmosOp: CosmosOperation = {
      id: encodeOperationId(accountId, op.hash, op.type),
      hash: op.hash,
      type: op.type,
      value: op.value,
      fee: op.fee,
      blockHash: op.blockHash,
      blockHeight: op.blockHeight,
      senders: op.senders,
      recipients: op.recipients,
      accountId,
      date: op.date,
      extra: op.extra as CosmosOperationExtra,
      transactionSequenceNumber: op.transactionSequenceNumber,
    };
    cosmosOp.hasFailed = op.hasFailed;
    return cosmosOp;
  });
