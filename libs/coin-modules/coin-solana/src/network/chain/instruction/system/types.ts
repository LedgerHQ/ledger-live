import { enums, number, type, string, Infer } from "superstruct";
import { PublicKeyFromString } from "../../validators/pubkey";

export type CreateAccountInfo = Infer<typeof CreateAccountInfo>;
export const CreateAccountInfo = type({
  source: PublicKeyFromString,
  newAccount: PublicKeyFromString,
  lamports: number(),
  space: number(),
  owner: PublicKeyFromString,
});

export type AssignInfo = Infer<typeof AssignInfo>;
export const AssignInfo = type({
  account: PublicKeyFromString,
  owner: PublicKeyFromString,
});

export type TransferInfo = Infer<typeof TransferInfo>;
export const TransferInfo = type({
  source: PublicKeyFromString,
  destination: PublicKeyFromString,
  lamports: number(),
});

export type CreateAccountWithSeedInfo = Infer<typeof CreateAccountWithSeedInfo>;
export const CreateAccountWithSeedInfo = type({
  source: PublicKeyFromString,
  newAccount: PublicKeyFromString,
  base: PublicKeyFromString,
  seed: string(),
  lamports: number(),
  space: number(),
  owner: PublicKeyFromString,
});

export type AdvanceNonceInfo = Infer<typeof AdvanceNonceInfo>;
export const AdvanceNonceInfo = type({
  nonceAccount: PublicKeyFromString,
  nonceAuthority: PublicKeyFromString,
});

export type WithdrawNonceInfo = Infer<typeof WithdrawNonceInfo>;
export const WithdrawNonceInfo = type({
  nonceAccount: PublicKeyFromString,
  destination: PublicKeyFromString,
  nonceAuthority: PublicKeyFromString,
  lamports: number(),
});

export type InitializeNonceInfo = Infer<typeof InitializeNonceInfo>;
export const InitializeNonceInfo = type({
  nonceAccount: PublicKeyFromString,
  nonceAuthority: PublicKeyFromString,
});

export type AuthorizeNonceInfo = Infer<typeof AuthorizeNonceInfo>;
export const AuthorizeNonceInfo = type({
  nonceAccount: PublicKeyFromString,
  nonceAuthority: PublicKeyFromString,
  newAuthorized: PublicKeyFromString,
});

export type AllocateInfo = Infer<typeof AllocateInfo>;
export const AllocateInfo = type({
  account: PublicKeyFromString,
  space: number(),
});

export type AllocateWithSeedInfo = Infer<typeof AllocateWithSeedInfo>;
export const AllocateWithSeedInfo = type({
  account: PublicKeyFromString,
  base: PublicKeyFromString,
  seed: string(),
  space: number(),
  owner: PublicKeyFromString,
});

export type AssignWithSeedInfo = Infer<typeof AssignWithSeedInfo>;
export const AssignWithSeedInfo = type({
  account: PublicKeyFromString,
  base: PublicKeyFromString,
  seed: string(),
  owner: PublicKeyFromString,
});

export type TransferWithSeedInfo = Infer<typeof TransferWithSeedInfo>;
export const TransferWithSeedInfo = type({
  source: PublicKeyFromString,
  sourceBase: PublicKeyFromString,
  destination: PublicKeyFromString,
  lamports: number(),
  sourceSeed: string(),
  sourceOwner: PublicKeyFromString,
});

export type SystemInstructionType = Infer<typeof SystemInstructionType>;
export const SystemInstructionType = enums([
  "createAccount",
  "createAccountWithSeed",
  "allocate",
  "allocateWithSeed",
  "assign",
  "assignWithSeed",
  "transfer",
  "advanceNonce",
  "withdrawNonce",
  "authorizeNonce",
  "initializeNonce",
  "transferWithSeed",
]);

export const IX_STRUCTS = {
  createAccount: CreateAccountInfo,
  createAccountWithSeed: CreateAccountWithSeedInfo,
  allocate: AllocateInfo,
  allocateWithSeed: AllocateWithSeedInfo,
  assign: AssignInfo,
  assignWithSeed: AssignWithSeedInfo,
  transfer: TransferInfo,
  advanceNonce: AdvanceNonceInfo,
  withdrawNonce: WithdrawNonceInfo,
  authorizeNonce: AuthorizeNonceInfo,
  initializeNonce: InitializeNonceInfo,
  transferWithSeed: TransferWithSeedInfo,
};

export const IX_TITLES = {
  createAccount: "Create Account",
  createAccountWithSeed: "Create Account With Seed",
  allocate: "Allocate",
  allocateWithSeed: "Allocate With Seed",
  assign: "Assign",
  assignWithSeed: "Assign With Seed",
  transfer: "Transfer",
  advanceNonce: "Advance Nonce",
  withdrawNonce: "Withdraw Nonce",
  authorizeNonce: "Authorize Nonce",
  initializeNonce: "Initialize Nonce",
  transferWithSeed: "Transfer With Seed",
};
