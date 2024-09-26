import {
  MultiversxProvider,
  MultiversxAccount,
  MultiversxOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/elrond/types";
import { LLDCoinFamily } from "../types";

export type MultiversxFamily = LLDCoinFamily<
  MultiversxAccount,
  Transaction,
  TransactionStatus,
  MultiversxOperation
>;

export interface UnbondingType {
  amount: string;
  seconds: number;
  contract?: string;
  validator?: MultiversxProvider;
}

export interface DelegationType {
  address: string;
  claimableRewards: string;
  contract: string;
  userActiveStake: string;
  userUnBondable: string;
  userUndelegatedList: Array<UnbondingType>;
  validator?: MultiversxProvider;
}
