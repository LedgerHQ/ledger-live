import { AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getEquivalentAddress } from "../network";

export enum Methods {
  Transfer = 0,
  ERC20Transfer = 1,
  InvokeEVM = 3844450837,
}

export enum AccountType {
  Account = "Account",
  TokenAccount = "TokenAccount",
}

export enum BotScenario {
  DEFAULT = "default",
  ETH_RECIPIENT = "eth-recipient",
  F4_RECIPIENT = "f4-recipient",
  TOKEN_TRANSFER = "token-transfer",
}

const validHexRegExp = new RegExp(/^(0x)?[a-fA-F0-9]+$/);
const validBase64RegExp = new RegExp(
  /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/,
);

// TODO Filecoin - Use the new package @zondax/ledger-utils instead

export const isValidHex = (msg: string) => validHexRegExp.test(msg) && msg.length % 2 === 0;
export const isValidBase64 = (msg: string) => validBase64RegExp.test(msg);

export const methodToString = (method: number): string => {
  switch (method) {
    case Methods.Transfer:
      return "Transfer";
    case Methods.InvokeEVM:
      return "InvokeEVM (3844450837)";
    case Methods.ERC20Transfer:
      return "ERC20 Transfer";
    default:
      return "Unknown";
  }
};

export const getBufferFromString = (message: string): Buffer =>
  isValidHex(message)
    ? Buffer.from(message, "hex")
    : isValidBase64(message)
      ? Buffer.from(message, "base64")
      : Buffer.from(message);

export const calculateEstimatedFees = (gasFeeCap: BigNumber, gasLimit: BigNumber): BigNumber =>
  gasFeeCap.multipliedBy(gasLimit);

export function getAccountUnit(account: AccountLike) {
  if (account.type === AccountType.TokenAccount) {
    return account.token.units[0];
  }

  return account.currency.units[0];
}

export const expectedToFieldForTokenTransfer = (recipient: string) => {
  let value = recipient;
  const equivalent = getEquivalentAddress(value);

  if (equivalent && value != equivalent) {
    value += ` / ${equivalent}`;
  }

  return value;
};
