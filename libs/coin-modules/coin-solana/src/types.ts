import BigNumber from "bignumber.js";
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
import { ValidatorsAppValidator } from "./validator-app";
import { TokenAccountState } from "./api/chain/account/token";

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
};

export type TokenTransferCommand = {
  kind: "token.transfer";
  ownerAddress: string;
  ownerAssociatedTokenAccountAddress: string;
  recipientDescriptor: TokenRecipientDescriptor;
  amount: number;
  mintAddress: string;
  mintDecimals: number;
  memo?: string | undefined;
};

export type Command =
  | TransferCommand
  | TokenTransferCommand
  | TokenCreateATACommand
  | StakeCreateAccountCommand
  | StakeDelegateCommand
  | StakeUndelegateCommand
  | StakeWithdrawCommand
  | StakeSplitCommand;

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

export type TransactionModel = { commandDescriptor?: CommandDescriptor } & (
  | TransferTransaction
  | TokenTransferTransaction
  | TokenCreateATATransaction
  | StakeCreateAccountTransaction
  | StakeDelegateTransaction
  | StakeUndelegateTransaction
  | StakeWithdrawTransaction
  | StakeSplitTransaction
);

export type Transaction = TransactionCommon & {
  family: "solana";
  model: TransactionModel;
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
export type SolanaTokenAccount = TokenAccount & { state?: TokenAccountState };
export type SolanaTokenAccountRaw = TokenAccountRaw & { state?: TokenAccountState };

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
