import {
  Account,
  AccountRaw,
  Operation,
  TokenAccount,
  TokenAccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { TokenAccountState } from "./network/chain/account/token";
import { PARSED_PROGRAMS } from "./network/chain/program/constants";
import { ValidatorsAppValidator } from "./network/validator-app";
import { UserInputType } from "./signer";

export type TransferCommand = {
  kind: "transfer";
  sender: string;
  recipient: string;
  amount: number;
  memo?: string | undefined;
};

export type TokenCreateATACommand = {
  kind: "token.createATA";
  owner: string;
  mint: string;
  associatedTokenAccountAddress: string;
};

export type TokenCreateApproveCommand = {
  kind: "token.approve";
  account: string;
  mintAddress: string;
  recipientDescriptor: TokenRecipientDescriptor;
  owner: string;
  amount: number;
  decimals: number;
  tokenProgram: SolanaTokenProgram;
};

export type TokenCreateRevokeCommand = {
  kind: "token.revoke";
  account: string;
  owner: string;
  tokenProgram: SolanaTokenProgram;
};

export type StakeCreateAccountCommand = {
  kind: "stake.createAccount";
  fromAccAddress: string;
  stakeAccAddress: string;
  seed: string;
  amount: number;
  stakeAccRentExemptAmount: number;
  delegate: {
    voteAccAddress: string;
  };
};

export type StakeDelegateCommand = {
  kind: "stake.delegate";
  authorizedAccAddr: string;
  stakeAccAddr: string;
  voteAccAddr: string;
};

export type StakeUndelegateCommand = {
  kind: "stake.undelegate";
  authorizedAccAddr: string;
  stakeAccAddr: string;
};

export type StakeWithdrawCommand = {
  kind: "stake.withdraw";
  authorizedAccAddr: string;
  stakeAccAddr: string;
  toAccAddr: string;
  amount: number;
};

export type StakeSplitCommand = {
  kind: "stake.split";
  authorizedAccAddr: string;
  stakeAccAddr: string;
  amount: number;
  seed: string;
  splitStakeAccAddr: string;
};

export type TokenRecipientDescriptor = {
  walletAddress: string;
  tokenAccAddress: string;
  shouldCreateAsAssociatedTokenAccount: boolean;
  userInputType: UserInputType;
};

export type TransferFeeCalculated = {
  maxTransferFee: number;
  transferFee: number;
  feePercent: number;
  feeBps: number;
  transferAmountIncludingFee: number;
  transferAmountExcludingFee: number;
};

export type TokenTransferCommand = {
  kind: "token.transfer";
  ownerAddress: string;
  ownerAssociatedTokenAccountAddress: string;
  recipientDescriptor: TokenRecipientDescriptor;
  amount: number;
  mintAddress: string;
  mintDecimals: number;
  tokenId: string;
  memo?: string | undefined;
  tokenProgram: SolanaTokenProgram;
  extensions?: {
    transferFee?: TransferFeeCalculated | undefined;
  };
};

export type RawCommand = {
  kind: "raw";
  raw: string;
};

export type Command =
  | TransferCommand
  | TokenTransferCommand
  | TokenCreateATACommand
  | TokenCreateApproveCommand
  | TokenCreateRevokeCommand
  | StakeCreateAccountCommand
  | StakeDelegateCommand
  | StakeUndelegateCommand
  | StakeWithdrawCommand
  | StakeSplitCommand
  | RawCommand;

export type CommandDescriptor = {
  command: Command;
  fee: number;
  warnings: Record<string, Error>;
  errors: Record<string, Error>;
};

export type TransferTransaction = {
  kind: "transfer";
  uiState: {
    memo?: string | undefined;
  };
};

export type TokenTransferTransaction = {
  kind: "token.transfer";
  uiState: {
    subAccountId: string;
    memo?: string | undefined;
  };
};

export type TokenCreateATATransaction = {
  kind: "token.createATA";
  uiState: {
    tokenId: string;
  };
};

export type TokenCreateApproveTransaction = {
  kind: "token.approve";
  uiState: {
    subAccountId: string;
  };
};

export type TokenCreateRevokeTransaction = {
  kind: "token.revoke";
  uiState: {
    subAccountId: string;
  };
};

export type StakeCreateAccountTransaction = {
  kind: "stake.createAccount";
  uiState: {
    delegate: {
      voteAccAddress: string;
    };
  };
};

export type StakeDelegateTransaction = {
  kind: "stake.delegate";
  uiState: {
    stakeAccAddr: string;
    voteAccAddr: string;
  };
};

export type StakeUndelegateTransaction = {
  kind: "stake.undelegate";
  uiState: {
    stakeAccAddr: string;
  };
};

export type StakeWithdrawTransaction = {
  kind: "stake.withdraw";
  uiState: {
    stakeAccAddr: string;
  };
};

export type StakeSplitTransaction = {
  kind: "stake.split";
  uiState: {
    stakeAccAddr: string;
  };
};

export type RawTransaction = {
  kind: "raw";
  uiState: object;
};

export type TransactionModel = { commandDescriptor?: CommandDescriptor } & (
  | TransferTransaction
  | TokenTransferTransaction
  | TokenCreateATATransaction
  | TokenCreateApproveTransaction
  | TokenCreateRevokeTransaction
  | StakeCreateAccountTransaction
  | StakeDelegateTransaction
  | StakeUndelegateTransaction
  | StakeWithdrawTransaction
  | StakeSplitTransaction
  | RawTransaction
);

export type Transaction = TransactionCommon & {
  family: "solana";
  model: TransactionModel;
  raw?: string;
  templateId?: string;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "solana";
  model: string;
};

export type SolanaStake = {
  stakeAccAddr: string;
  hasStakeAuth: boolean;
  hasWithdrawAuth: boolean;
  delegation:
    | {
        stake: number;
        voteAccAddr: string;
      }
    | undefined;
  stakeAccBalance: number;
  rentExemptReserve: number;
  withdrawable: number;
  activation: {
    state: "active" | "inactive" | "activating" | "deactivating";
    active: number;
    inactive: number;
  };
  reward?:
    | {
        amount: number;
      }
    | undefined;
};

export type SolanaStakeWithMeta = {
  stake: SolanaStake;
  meta: {
    validator?: {
      name?: string;
      img?: string;
      url?: string;
    };
  };
};

export type SolanaResources = {
  stakes: SolanaStake[];
  unstakeReserve: BigNumber;
};

export type SolanaResourcesRaw = {
  stakes: string;
  unstakeReserve: string;
};

export type SolanaValidator = {
  voteAccAddr: string;
  commission: number;
  activatedStake: number;
};

export type SolanaPreloadDataV1 = {
  version: "1";
  validatorsWithMeta: SolanaValidatorWithMeta[];
  validators: ValidatorsAppValidator[];
};

// exists for discriminated union to work
export type SolanaPreloadDataV2 = {
  version: "2";
};

export type SolanaPreloadData = SolanaPreloadDataV1 | SolanaPreloadDataV2;

export type SolanaValidatorWithMeta = {
  validator: SolanaValidator;
  meta: {
    name?: string;
    img?: string;
  };
};

export type StakeAction = "deactivate" | "activate" | "withdraw" | "reactivate";

export type SolanaAccount = Account & { solanaResources: SolanaResources };

export type SolanaAccountRaw = AccountRaw & {
  solanaResources: SolanaResourcesRaw;
};

type Base58PubKey = string;
export type SolanaTokenAccountExtensions = {
  permanentDelegate?: {
    delegateAddress: Base58PubKey | undefined;
  };
  nonTransferable?: boolean;
  interestRate?: {
    rateBps: number;
    accruedDelta: number | undefined;
  };
  transferFee?: {
    feeBps: number;
    maxFee: number;
  };
  requiredMemoOnTransfer?: boolean;
  transferHook?: {
    programAddress: Base58PubKey | undefined;
  };
};

export type SolanaTokenProgram =
  | typeof PARSED_PROGRAMS.SPL_TOKEN
  | typeof PARSED_PROGRAMS.SPL_TOKEN_2022;
export type SolanaTokenAccount = TokenAccount & {
  state?: TokenAccountState;
  extensions?: SolanaTokenAccountExtensions | undefined;
};
export type SolanaTokenAccountRaw = TokenAccountRaw & {
  state?: TokenAccountState;
  extensions?: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type SolanaOperation = Operation<SolanaOperationExtra>;
export type SolanaOperationRaw = Operation<SolanaOperationExtraRaw>;

export type ExtraStakeInfo = {
  address: string;
  amount: BigNumber;
};

export type ExtraStakeInfoRaw = {
  address: string;
  amount: string;
};

export type SolanaOperationExtra = {
  memo?: string | undefined;
  stake?: ExtraStakeInfo;
};

export type SolanaOperationExtraRaw = {
  memo?: string | undefined;
  stake?: ExtraStakeInfoRaw;
};

export type SolanaExtraDeviceTransactionField = {
  type: "solana.token.transferFee";
  label: string;
};
