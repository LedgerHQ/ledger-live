/**
 * Transport-neutral chain shapes. The gRPC and GraphQL mappers both emit these, and every
 * operation / block parser in `sdk.ts` reads only these. Each type carries only the fields a
 * consumer reads.
 */

/**
 * `Pure` input. BCS carries no type information, so the mappers recover `valueType` from the byte
 * length: 8 bytes is a u64, 32 bytes is an address. Other lengths stay `null`.
 */
export type SuiPureInput = {
  type: "pure";
  valueType: "u64" | "address" | null;
  value: string | null;
};

export type SuiObjectInput = {
  type: "object";
  objectType: "immOrOwnedObject" | "sharedObject" | "receiving";
  objectId: string;
  mutable?: boolean;
};

export type SuiInput = SuiPureInput | SuiObjectInput;

export type SuiMoveCall = { package: string; module: string; function: string };

/** Only `MoveCall` is read downstream; every other command keeps its kind name only. */
export type SuiCommand = { MoveCall: SuiMoveCall } | { Other: string };

export type SuiProgrammableTransaction = {
  kind: "ProgrammableTransaction";
  inputs: SuiInput[];
  transactions: SuiCommand[];
};

/** System transactions (`ConsensusCommitPrologue`, `ChangeEpoch`, …) keep their kind name only. */
export type SuiSystemTransaction = { kind: "System"; name: string };

export type SuiTransactionKind = SuiProgrammableTransaction | SuiSystemTransaction;

export type SuiTransactionData = {
  sender: string;
  /** For sponsored transactions the gas owner is the sponsor; otherwise it is the sender. */
  gasData: { owner?: string | undefined };
  transaction: SuiTransactionKind;
};

export type SuiBalanceChange = {
  address: string;
  coinType: string;
  /** Signed base-10 integer. */
  amount: string;
};

/** SIP-58 accumulator write. `ty` is `0x2::balance::Balance<COIN>`. */
export type SuiAccumulatorEvent = {
  address: string;
  ty: string;
  operation: "merge" | "split";
  value: { integer: string };
};

export type SuiEvent = {
  /** Short struct tag, e.g. `0x3::validator::StakingRequestEvent`. */
  type: string;
  parsedJson: unknown;
};

export type SuiExecutionStatus = { status: "success" } | { status: "failure"; error: string };

export type SuiTransactionEffects = {
  status: SuiExecutionStatus;
  gasUsed: { computationCost: string; storageCost: string; storageRebate: string };
  accumulatorEvents: SuiAccumulatorEvent[];
};

export type SuiTransactionResponse = {
  digest: string;
  transaction: { data: SuiTransactionData };
  effects: SuiTransactionEffects;
  events: SuiEvent[];
  balanceChanges: SuiBalanceChange[];
  /** `null` until the transaction is included in a checkpoint. */
  timestampMs: string | null;
  checkpoint: string | null;
};

export type SuiCheckpoint = {
  digest: string;
  sequenceNumber: string;
  timestampMs: string;
  previousDigest?: string | null | undefined;
};

export type SuiCoinBalance = {
  coinType: string;
  totalBalance: string;
  /** SIP-58 address-balance portion of `totalBalance`. */
  fundsInAddressBalance?: string;
};

export type SuiExecuteTransactionParams = {
  /** BCS transaction bytes, or their base64 encoding. */
  transactionBlock: string | Uint8Array;
  signature: string | string[];
};

/** Checkpoint metadata without the parent link. */
export type MinimalCheckpoint = Omit<SuiCheckpoint, "previousDigest">;
