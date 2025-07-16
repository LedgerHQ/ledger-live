/* eslint-disable @typescript-eslint/no-redeclare */

import {
  Infer,
  number,
  literal,
  enums,
  union,
  boolean,
  array,
  type,
  nullable,
  size,
  string,
  optional,
  any,
} from "superstruct";
import { PublicKeyFromString } from "../validators/pubkey";

// Token2022 extensions guide: https://spl.solana.com/token-2022/extensions

export type DefaultTokenAccountState = Infer<typeof DefaultAccountState>;
export const DefaultAccountState = enums(["initialized", "frozen"]);

// token account extensions
export type TokenAccountExtensionType = Infer<typeof TokenAccountExtensionType>;
export const TokenAccountExtensionType = enums([
  "transferFeeAmount",
  "immutableOwner",
  "memoTransfer",
  "cpiGuard",
  "nonTransferableAccount",
  "confidentialTransferAccount",
  "confidentialTransferFeeAmount",
  "transferHookAccount",
]);

export type ImmutableOwnerExt = Infer<typeof ImmutableOwnerExt>;
export const ImmutableOwnerExt = type({
  extension: literal("immutableOwner"),
});

export type MemoTransferExt = Infer<typeof MemoTransferExt>;
export type MemoTransferState = Infer<typeof MemoTransferState>;
export const MemoTransferState = type({
  requireIncomingTransferMemos: boolean(),
});
export const MemoTransferExt = type({
  extension: literal("memoTransfer"),
  state: MemoTransferState,
});

export type TransferFeeAmountExt = Infer<typeof TransferFeeAmountExt>;
export type TransferFeeAmountState = Infer<typeof TransferFeeAmountState>;
export const TransferFeeAmountState = type({
  withheldAmount: number(),
});
export const TransferFeeAmountExt = type({
  extension: literal("transferFeeAmount"),
  state: TransferFeeAmountState,
});

export type СpiGuardExt = Infer<typeof СpiGuardExt>;
export type СpiGuardState = Infer<typeof СpiGuardState>;
export const СpiGuardState = type({
  lockCpi: boolean(),
});
export const СpiGuardExt = type({
  extension: literal("cpiGuard"),
  state: СpiGuardState,
});

export type NonTransferableAccountExt = Infer<typeof NonTransferableAccountExt>;
export const NonTransferableAccountExt = type({
  extension: literal("nonTransferableAccount"),
});

export type ConfidentialTransferAccountExt = Infer<typeof ConfidentialTransferAccountExt>;
export type ConfidentialTransferAccountState = Infer<typeof ConfidentialTransferAccountState>;
export const ConfidentialTransferAccountState = type({
  approved: boolean(),
  elgamalPubkey: string(),
  pendingBalanceLo: string(),
  pendingBalanceHi: string(),
  availableBalance: string(),
  decryptableAvailableBalance: string(),
  allowConfidentialCredits: boolean(),
  allowNonConfidentialCredits: boolean(),
  pendingBalanceCreditCounter: number(),
  maximumPendingBalanceCreditCounter: number(),
  expectedPendingBalanceCreditCounter: number(),
  actualPendingBalanceCreditCounter: number(),
});
export const ConfidentialTransferAccountExt = type({
  extension: literal("confidentialTransferAccount"),
  state: ConfidentialTransferAccountState,
});

export type ConfidentialTransferFeeAmountExt = Infer<typeof ConfidentialTransferFeeAmountExt>;
export type ConfidentialTransferFeeAmountState = Infer<typeof ConfidentialTransferFeeAmountState>;
export const ConfidentialTransferFeeAmountState = type({
  withheldAmount: string(),
});
export const ConfidentialTransferFeeAmountExt = type({
  extension: literal("confidentialTransferFeeAmount"),
  state: ConfidentialTransferFeeAmountState,
});

export type TransferHookAccountExt = Infer<typeof TransferHookAccountExt>;
export type TransferHookAccountState = Infer<typeof TransferHookAccountState>;
export const TransferHookAccountState = type({
  transferring: boolean(),
});
export const TransferHookAccountExt = type({
  extension: literal("transferHookAccount"),
  state: TransferHookAccountState,
});

export const UnknownExt = type({
  extension: string(),
  state: optional(any()),
});

export type TokenAccountExtensions = Infer<typeof TokenAccountExtensions>;
export const TokenAccountExtensions = array(
  union([
    ImmutableOwnerExt,
    MemoTransferExt,
    TransferFeeAmountExt,
    СpiGuardExt,
    NonTransferableAccountExt,
    ConfidentialTransferFeeAmountExt,
    TransferHookAccountExt,
  ]),
);

// mint extensions
export type MintExtensionType = Infer<typeof MintExtensionType>;
export const MintExtensionType = enums([
  "transferFeeConfig",
  "mintCloseAuthority",
  "permanentDelegate",
  "interestBearingConfig",
  "defaultAccountState",
  "nonTransferable",
  "transferHook",
  "metadataPointer",
  "tokenMetadata",
  "confidentialTransferMint",
  "confidentialTransferFeeConfig",
  "groupPointer",
  "groupMemberPointer",
  "tokenGroup",
  "tokenGroupMember",
]);

const TransferFee = type({
  epoch: number(),
  maximumFee: number(),
  transferFeeBasisPoints: number(),
});
export type TransferFeeConfigExt = Infer<typeof TransferFeeConfigExt>;
export type TransferFeeConfigState = Infer<typeof TransferFeeConfigState>;
export const TransferFeeConfigState = type({
  newerTransferFee: TransferFee,
  olderTransferFee: TransferFee,
  transferFeeConfigAuthority: nullable(PublicKeyFromString),
  withdrawWithheldAuthority: nullable(PublicKeyFromString),
  withheldAmount: number(),
});
export const TransferFeeConfigExt = type({
  extension: literal("transferFeeConfig"),
  state: TransferFeeConfigState,
});

export type MintCloseAuthorityExt = Infer<typeof MintCloseAuthorityExt>;
export type MintCloseAuthorityState = Infer<typeof MintCloseAuthorityState>;
export const MintCloseAuthorityState = type({
  closeAuthority: nullable(PublicKeyFromString),
});
export const MintCloseAuthorityExt = type({
  extension: literal("mintCloseAuthority"),
  state: MintCloseAuthorityState,
});

export type PermanentDelegateExt = Infer<typeof PermanentDelegateExt>;
export type PermanentDelegateState = Infer<typeof PermanentDelegateState>;
export const PermanentDelegateState = type({
  delegate: nullable(PublicKeyFromString),
});
export const PermanentDelegateExt = type({
  extension: literal("permanentDelegate"),
  state: PermanentDelegateState,
});

export type InterestBearingConfigExt = Infer<typeof InterestBearingConfigExt>;
export type InterestBearingConfigState = Infer<typeof InterestBearingConfigState>;
export const InterestBearingConfigState = type({
  rateAuthority: nullable(PublicKeyFromString),
  initializationTimestamp: number(),
  preUpdateAverageRate: number(),
  lastUpdateTimestamp: number(),
  currentRate: number(),
});
export const InterestBearingConfigExt = type({
  extension: literal("interestBearingConfig"),
  state: InterestBearingConfigState,
});

export type DefaultAccountStateExt = Infer<typeof DefaultAccountStateExt>;
export type DefaultAccountStateState = Infer<typeof DefaultAccountStateState>;
export const DefaultAccountStateState = type({
  state: DefaultAccountState,
});
export const DefaultAccountStateExt = type({
  extension: literal("defaultAccountState"),
  state: DefaultAccountStateState,
});

export type NonTransferableExt = Infer<typeof NonTransferableExt>;
export const NonTransferableExt = type({
  extension: literal("nonTransferable"),
});

export type TransferHookExt = Infer<typeof TransferHookExt>;
export type TransferHookState = Infer<typeof TransferHookState>;
export const TransferHookState = type({
  authority: nullable(PublicKeyFromString),
  programId: nullable(PublicKeyFromString),
});
export const TransferHookExt = type({
  extension: literal("transferHook"),
  state: TransferHookState,
});

export type MetadataPointerExt = Infer<typeof MetadataPointerExt>;
export type MetadataPointerState = Infer<typeof MetadataPointerState>;
export const MetadataPointerState = type({
  authority: nullable(PublicKeyFromString),
  metadataAddress: nullable(PublicKeyFromString),
});
export const MetadataPointerExt = type({
  extension: literal("metadataPointer"),
  state: MetadataPointerState,
});

export type TokenMetadataExt = Infer<typeof TokenMetadataExt>;
export type TokenMetadataState = Infer<typeof TokenMetadataState>;
export const TokenMetadataState = type({
  additionalMetadata: array(size(array(string()), 2, 2)),
  mint: PublicKeyFromString,
  name: string(),
  symbol: string(),
  updateAuthority: nullable(PublicKeyFromString),
  uri: string(),
});
export const TokenMetadataExt = type({
  extension: literal("tokenMetadata"),
  state: TokenMetadataState,
});

export type ConfidentialTransferMintExt = Infer<typeof ConfidentialTransferMintExt>;
export type ConfidentialTransferMintState = Infer<typeof ConfidentialTransferMintState>;
export const ConfidentialTransferMintState = type({
  authority: nullable(PublicKeyFromString),
  autoApproveNewAccounts: boolean(),
  auditorElgamalPubkey: nullable(string()),
});
export const ConfidentialTransferMintExt = type({
  extension: literal("confidentialTransferMint"),
  state: ConfidentialTransferMintState,
});

export type ConfidentialTransferFeeConfigExt = Infer<typeof ConfidentialTransferFeeConfigExt>;
export type ConfidentialTransferFeeConfigState = Infer<typeof ConfidentialTransferFeeConfigState>;
export const ConfidentialTransferFeeConfigState = type({
  authority: nullable(PublicKeyFromString),
  harvestToMintEnabled: boolean(),
  withdrawWithheldAuthorityElgamalPubkey: nullable(string()),
  withheldAmount: string(),
});
export const ConfidentialTransferFeeConfigExt = type({
  extension: literal("confidentialTransferFeeConfig"),
  state: ConfidentialTransferFeeConfigState,
});

export type GroupPointerExt = Infer<typeof GroupPointerExt>;
export type GroupPointerState = Infer<typeof GroupPointerState>;
export const GroupPointerState = type({
  authority: nullable(PublicKeyFromString),
  groupAddress: nullable(PublicKeyFromString),
});
export const GroupPointerExt = type({
  extension: literal("groupPointer"),
  state: GroupPointerState,
});

export type GroupMemberPointerExt = Infer<typeof GroupMemberPointerExt>;
export type GroupMemberPointerState = Infer<typeof GroupMemberPointerState>;
export const GroupMemberPointerState = type({
  authority: nullable(PublicKeyFromString),
  memberAddress: nullable(PublicKeyFromString),
});
export const GroupMemberPointerExt = type({
  extension: literal("groupMemberPointer"),
  state: GroupMemberPointerState,
});

export type TokenGroupExt = Infer<typeof TokenGroupExt>;
export type TokenGroupState = Infer<typeof TokenGroupState>;
export const TokenGroupState = type({
  maxSize: number(),
  mint: PublicKeyFromString,
  size: number(),
  updateAuthority: nullable(PublicKeyFromString),
});
export const TokenGroupExt = type({
  extension: literal("tokenGroup"),
  state: TokenGroupState,
});

export type TokenGroupMemberExt = Infer<typeof TokenGroupMemberExt>;
export type TokenGroupMemberState = Infer<typeof TokenGroupMemberState>;
export const TokenGroupMemberState = type({
  group: PublicKeyFromString,
  memberNumber: number(),
  mint: PublicKeyFromString,
});
export const TokenGroupMemberExt = type({
  extension: literal("tokenGroupMember"),
  state: TokenGroupMemberState,
});

export type MintExt = Infer<typeof MintExt>;
export const MintExt = union([
  NonTransferableExt,
  TransferFeeConfigExt,
  MintCloseAuthorityExt,
  PermanentDelegateExt,
  InterestBearingConfigExt,
  DefaultAccountStateExt,
  TransferHookExt,
  MetadataPointerExt,
  TokenMetadataExt,
  ConfidentialTransferMintExt,
  ConfidentialTransferFeeConfigExt,
  GroupPointerExt,
  GroupMemberPointerExt,
  TokenGroupExt,
  TokenGroupMemberExt,
]);
export type MintExtensions = Infer<typeof MintExtensions>;
export const MintExtensions = array(
  union([
    TransferFeeConfigExt,
    MintCloseAuthorityExt,
    PermanentDelegateExt,
    InterestBearingConfigExt,
    DefaultAccountStateExt,
    NonTransferableExt,
    TransferHookExt,
    MetadataPointerExt,
    TokenMetadataExt,
    ConfidentialTransferMintExt,
    ConfidentialTransferFeeConfigExt,
    GroupPointerExt,
    GroupMemberPointerExt,
    TokenGroupExt,
    TokenGroupMemberExt,
  ]),
);

export type ExtensionType = Infer<typeof ExtensionType>;
export const ExtensionType = union([TokenAccountExtensionType, MintExtensionType]);
