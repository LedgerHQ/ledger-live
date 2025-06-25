import { BigNumber } from "bignumber.js";
import { MAX_MEMO_VALUE } from "../consts";
import { secondsToDuration } from "@zondax/ledger-live-icp/utils";
import { InternetComputerOperation, Transaction } from "../types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { OperationType } from "@ledgerhq/types-live";

const validHexRegExp = new RegExp(/[0-9A-Fa-f]{6}/g);
const validBase64RegExp = new RegExp(
  /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/,
);

export const isNoErrorReturnCode = (code: number): boolean => code === 0x9000;

export const getPath = (path: string): string =>
  path && path.substr(0, 2) !== "m/" ? `m/${path}` : path;

export const isValidHex = (msg: string): boolean => validHexRegExp.test(msg);
export const isValidBase64 = (msg: string): boolean => validBase64RegExp.test(msg);

export const isError = (r: { returnCode: number; errorMessage?: string }): void => {
  if (!isNoErrorReturnCode(r.returnCode)) throw new Error(`${r.returnCode} - ${r.errorMessage}`);
};

export const methodToString = (method: Transaction["type"]): string => {
  switch (method) {
    case undefined:
      return "Send ICP";
    case "create_neuron":
      return "Stake Neuron";
    case "list_neurons":
      return "List Own Neurons";
    case "disburse":
      return "Disburse Neuron";
    case "stake_maturity":
      return "Stake Maturity";
    case "start_dissolving":
      return "Start Dissolving";
    case "stop_dissolving":
      return "Stop Dissolving";
    case "spawn_neuron":
      return "Spawn Neuron";
    case "refresh_voting_power":
      return "Refresh Voting Power";
    case "auto_stake_maturity":
      return "Set Auto Stake Maturity";
    case "increase_dissolve_delay":
      return "Increase Dissolve Delay";
    case "set_dissolve_delay":
      return "Set Dissolve Delay";
    case "split_neuron":
      return "Split Neuron";
    case "remove_hot_key":
      return "Remove HotKey";
    case "add_hot_key":
      return "Add HotKey";
    case "follow":
      return "Follow";
    default:
      return "Send ICP";
  }
};

export const getBufferFromString = (message: string): Buffer =>
  isValidHex(message)
    ? Buffer.from(message, "hex")
    : isValidBase64(message)
      ? Buffer.from(message, "base64")
      : Buffer.from(message);

export const normalizeEpochTimestamp = (timestamp: string): number => {
  return parseInt(timestamp.slice(0, 13));
};

function randomIntFromInterval(min: number, max: number): string {
  const minBig = new BigNumber(min);
  const maxBig = new BigNumber(max);

  const random = BigNumber.random().multipliedBy(maxBig.minus(minBig).plus(1)).plus(minBig);
  const randomInt = random.integerValue(BigNumber.ROUND_FLOOR);

  return randomInt.toString();
}

export function getRandomTransferID(): string {
  return randomIntFromInterval(0, MAX_MEMO_VALUE);
}

export const reassignOperationType = (
  operations: InternetComputerOperation[],
  neuronAddresses: string[],
) => {
  return operations.map(op => {
    if (neuronAddresses.includes(op.recipients[0])) {
      const type: OperationType = BigNumber(op.extra.memo ?? "0").gt(0)
        ? "STAKE_NEURON"
        : "TOP_UP_NEURON";
      return { ...op, id: encodeOperationId(op.accountId, op.hash, type), type };
    }

    return op;
  });
};

export const secondsToDurationString = (seconds: string) => {
  return secondsToDuration({ seconds: BigInt(parseInt(seconds)) });
};
