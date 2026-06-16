import type {
  Account,
  AccountRaw,
  Operation,
  OperationExtra,
  OperationExtraRaw,
  OperationRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { NATIVE_FEE_CURRENCY_MARKER } from "../constants";

export type CeloOperationMode =
  | "send"
  | "lock"
  | "unlock"
  | "withdraw"
  | "vote"
  | "revoke"
  | "activate"
  | "register";

export type CeloVoteType = "pending" | "active";
export type CeloVoteStatus = CeloVoteType | "awaitingActivation";

/** Celo revoke txo from contractkit (has _method.name at runtime). */
export type RevokeTxo = { _method: { name: string } };

export type CeloPendingWithdrawal = {
  value: BigNumber;
  time: BigNumber;
  index: number;
};
export type CeloPendingWithdrawalRaw = {
  value: string;
  time: string;
  index: string;
};
export type CeloResources = {
  registrationStatus: boolean;
  lockedBalance: BigNumber;
  nonvotingLockedBalance: BigNumber;
  pendingWithdrawals: CeloPendingWithdrawal[] | null | undefined;
  votes: CeloVote[] | null | undefined;
  electionAddress: string | null | undefined;
  lockedGoldAddress: string | null | undefined;
  maxNumGroupsVotedFor: BigNumber;
};
export type CeloResourcesRaw = {
  registrationStatus: boolean;
  lockedBalance: string;
  nonvotingLockedBalance: string;
  pendingWithdrawals: CeloPendingWithdrawalRaw[] | null | undefined;
  votes: CeloVoteRaw[] | null | undefined;
  electionAddress: string | null | undefined;
  lockedGoldAddress: string | null | undefined;
  maxNumGroupsVotedFor: string;
};
export type Transaction = TransactionCommon & {
  family: "celo";
  fees: BigNumber | null | undefined;
  // adapter address or contract address for fee currency
  feeCurrency?: `0x${string}` | null | undefined;
  // always contract address for fee currency
  feeCurrencyUnwrapped?: `0x${string}` | null | undefined;
  feeCurrencyAccountId?: string | null | undefined;
  mode: CeloOperationMode;
  index: number | null | undefined;
  data?: Buffer | null | undefined;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "celo";
  fees: string | null | undefined;
  feeCurrency?: `0x${string}` | null | undefined;
  feeCurrencyUnwrapped?: `0x${string}` | null | undefined;
  feeCurrencyAccountId?: string | null | undefined;
  mode: CeloOperationMode;
  index: number | null | undefined;
};
export type CeloValidatorGroup = {
  address: string;
  name: string;
  votes: BigNumber;
};
export type CeloVote = {
  validatorGroup: string;
  amount: BigNumber;
  activatable: boolean;
  revokable: boolean;
  type: CeloVoteType;
  index: number;
};
export type CeloVoteRaw = {
  validatorGroup: string;
  amount: string;
  activatable: boolean;
  revokable: boolean;
  type: CeloVoteType;
  index: number;
};
export type FigmentIndexerTransaction = {
  id: number;
  height: number;
  time: string;
  transaction_hash: string;
  address: string;
  amount: number;
  kind: string;
  data?: {
    Raw?: {
      data: string;
      topics: Array<string>;
      address: string;
      removed: boolean;
      logIndex: string;
      blockHash: string;
      blockNumber: string;
      transactionHash: string;
      transactionIndex: string;
    };
    gas: number;
    Account?: string;
    Group?: string;
    success?: boolean;
    from?: string;
    to?: string;
    gas_used: number;
    gas_price: number;
  };
};

export type CeloPreloadData = {
  validatorGroups: CeloValidatorGroup[];
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type CeloAccount = Account & { celoResources: CeloResources };

export type CeloAccountRaw = AccountRaw & { celoResources: CeloResourcesRaw };

export type PendingStakingOperationAmounts = {
  vote: BigNumber;
  lock: BigNumber;
};

export type CeloOperation = Operation<CeloOperationExtra>;
export type CeloOperationRaw = OperationRaw<CeloOperationExtraRaw>;

export type CeloOperationExtra = {
  celoOperationValue?: BigNumber;
  celoSourceValidator?: string;
  // Tri-state fee-currency tag:
  //   - lowercased 0x… address → CIP-64 tx, fees paid in that ERC-20
  //   - NATIVE_FEE_CURRENCY_MARKER → confirmed non-CIP-64, fees paid in CELO
  //   - absent → not yet enriched (e.g. inside the reorg window, or RPC failed)
  feeCurrencyAddress?: string;
};
// `feeCurrencyAddress` has a generic name, so we also validate its value shape
// to avoid false-matching another family's extras: must be either the NATIVE
// sentinel or a 20-byte EVM address (40 hex chars).
const HEX_ADDRESS_RE = /^0x[0-9a-f]{40}$/i;
const hasCeloFeeCurrencyAddress = (op: object): boolean => {
  const v = (op as Record<string, unknown>).feeCurrencyAddress;
  return typeof v === "string" && (v === NATIVE_FEE_CURRENCY_MARKER || HEX_ADDRESS_RE.test(v));
};
const hasAnyCeloExtraKey = (op: object): boolean =>
  "celoOperationValue" in op || "celoSourceValidator" in op || hasCeloFeeCurrencyAddress(op);

export function isCeloOperationExtra(op: OperationExtra): op is CeloOperationExtra {
  return op !== null && typeof op === "object" && hasAnyCeloExtraKey(op);
}
export type CeloOperationExtraRaw = {
  celoOperationValue?: string;
  celoSourceValidator?: string;
  feeCurrencyAddress?: string;
};
export function isCeloOperationExtraRaw(op: OperationExtraRaw): op is CeloOperationExtraRaw {
  return op !== null && typeof op === "object" && hasAnyCeloExtraKey(op);
}
