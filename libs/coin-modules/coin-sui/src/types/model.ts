import type { DeviceModelId } from "@ledgerhq/devices";

export type Resolution = {
  deviceModelId?: DeviceModelId | undefined;
  certificateSignatureKind?: "prod" | "test" | undefined;
  tokenAddress?: string;
  tokenId?: string;
};

export type SuiOperationMode = "send";

export type AccountInfoResponse = Record<string, string>;

export type CoreTransaction = {
  /** The transaction in a serialized format, ready to be signed. */
  unsigned: Uint8Array;

  /** The input objects referenced in the transaction, in serialized form.. */
  objects?: Uint8Array[];

  /* The token resolution for clear signing */
  resolution?: Resolution;
};

type StakeObjectBase = {
  /** ID of the `StakedSui` receipt object. */
  stakedSuiId: string;
  principal: string;
  stakeRequestEpoch: string;
  stakeActiveEpoch: string;
};

/** A single `StakedSui` position. Discriminated on `status`; only `Active` accrues a reward. */
export type StakeObject =
  | (StakeObjectBase & { status: "Pending" })
  | (StakeObjectBase & { status: "Active"; estimatedReward: string })
  | (StakeObjectBase & { status: "Unstaked" });

/** The stakes an owner holds in one validator's staking pool. */
export type DelegatedStake = {
  validatorAddress: string;
  stakingPool: string;
  stakes: StakeObject[];
};
