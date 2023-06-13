import {
  ElrondProvider,
  ElrondAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/elrond/types";
import { LLDCoinFamily } from "../types";

export type ElrondFamily = LLDCoinFamily<ElrondAccount, Transaction, TransactionStatus>;

export interface UnbondingType {
  amount: string;
  seconds: number;
  contract?: string;
  validator?: ElrondProvider;
}

export interface DelegationType {
  address: string;
  claimableRewards: string;
  contract: string;
  userActiveStake: string;
  userUnBondable: string;
  userUndelegatedList: Array<UnbondingType>;
  validator?: ElrondProvider;
}
