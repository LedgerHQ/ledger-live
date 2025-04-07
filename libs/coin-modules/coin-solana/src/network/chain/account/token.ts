/* eslint-disable @typescript-eslint/no-redeclare */

import {
  Infer,
  number,
  optional,
  enums,
  any,
  boolean,
  string,
  array,
  type,
  nullable,
} from "superstruct";
import { PublicKeyFromString } from "../validators/pubkey";
import { MintExtensions, TokenAccountExtensions } from "./tokenExtensions";

export type TokenAccountType = Infer<typeof TokenAccountType>;
export const TokenAccountType = enums(["mint", "account", "multisig"]);

export type TokenAccountState = Infer<typeof AccountState>;
export const AccountState = enums(["initialized", "uninitialized", "frozen"]);

const TokenAmount = type({
  decimals: number(),
  uiAmountString: string(),
  uiAmount: number(),
  amount: string(),
});

export type TokenAccountInfo = Infer<typeof TokenAccountInfo>;
export const TokenAccountInfo = type({
  mint: PublicKeyFromString,
  owner: PublicKeyFromString,
  tokenAmount: TokenAmount,
  delegate: optional(PublicKeyFromString),
  state: AccountState,
  isNative: boolean(),
  rentExemptReserve: optional(TokenAmount),
  delegatedAmount: optional(TokenAmount),
  closeAuthority: optional(PublicKeyFromString),
  extensions: optional(TokenAccountExtensions),
});

export type MintAccountInfo = Infer<typeof MintAccountInfo>;
export const MintAccountInfo = type({
  mintAuthority: nullable(PublicKeyFromString),
  supply: string(),
  decimals: number(),
  isInitialized: boolean(),
  freezeAuthority: nullable(PublicKeyFromString),
  extensions: optional(MintExtensions),
});

export type MultisigAccountInfo = Infer<typeof MultisigAccountInfo>;
export const MultisigAccountInfo = type({
  numRequiredSigners: number(),
  numValidSigners: number(),
  isInitialized: boolean(),
  signers: array(PublicKeyFromString),
});

export type TokenAccount = Infer<typeof TokenAccount>;
export const TokenAccount = type({
  type: TokenAccountType,
  info: any(),
});
