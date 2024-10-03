import {
  MultiversXProvider,
  MultiversXAccount,
  MultiversXOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/multiversx/types";
import { LLDCoinFamily } from "../types";

export type MultiversXFamily = LLDCoinFamily<
  MultiversXAccount,
  Transaction,
  TransactionStatus,
  MultiversXOperation
>;

export interface UnbondingType {
  amount: string;
  seconds: number;
  contract?: string;
  validator?: MultiversXProvider;
}

export interface DelegationType {
  address: string;
  claimableRewards: string;
  contract: string;
  userActiveStake: string;
  userUnBondable: string;
  userUndelegatedList: Array<UnbondingType>;
  validator?: MultiversXProvider;
}
