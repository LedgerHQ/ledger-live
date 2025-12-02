import type BigNumber from "bignumber.js";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { OperationType } from "@ledgerhq/types-live";
import type { HederaOperationExtra } from "./bridge";
import type { HEDERA_OPERATION_TYPES } from "../constants";
import type { HederaMirrorContractCallResult, HederaMirrorTransaction } from "./mirror";
import type { HederaThirdwebTransaction } from "./thirdweb";

export type EstimateFeesParams =
  | {
      currency: CryptoCurrency;
      operationType: Exclude<HEDERA_OPERATION_TYPES, HEDERA_OPERATION_TYPES.ContractCall>;
    }
  | {
      operationType: HEDERA_OPERATION_TYPES.ContractCall;
      txIntent: TransactionIntent;
    };

export interface EstimateFeesResult {
  tinybars: BigNumber;
  gas?: BigNumber;
}

export interface OperationERC20 {
  thirdwebTransaction: HederaThirdwebTransaction;
  mirrorTransaction: HederaMirrorTransaction;
  contractCallResult: HederaMirrorContractCallResult;
  token: TokenCurrency;
}

export interface ERC20OperationFields {
  date: Date;
  type: OperationType;
  fee: BigNumber;
  value: BigNumber;
  senders: string[];
  recipients: string[];
  blockHeight: number;
  blockHash: string;
  extra: HederaOperationExtra;
  standard: "erc20";
  hasFailed: false;
}

export interface OperationDetailsExtraField {
  key: string;
  value: string | number;
}
