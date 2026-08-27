import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";

type ChainId = string | number;
type BlockchainFamily = string;
type Proof = string;

export type RenameLedgerAccountIntentInput = Readonly<{
  previousAccountName: string;
  newAccountName: string;
  derivationPath: string;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  hmacProof: Proof;
}>;

export type RenameLedgerAccountResult = Readonly<{
  previousAccountName: string;
  accountName: string;
  derivationPath: string;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  hmacProof: Proof;
}>;

export type RenameLedgerAccountJobState =
  | { readonly type: "pending" }
  | { readonly type: "awaiting-device-confirmation" }
  | { readonly type: "completed"; readonly result: RenameLedgerAccountResult }
  | { readonly type: "failed"; readonly error: Error };

export type RenameLedgerAccountIntentDefinition = IntentDefinition<
  RenameLedgerAccountJobState,
  RenameLedgerAccountIntentInput
>;

export type RenameLedgerAccountIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<RenameLedgerAccountJobState, RenameLedgerAccountIntentInput, ExtraProps>;

export type RenameLedgerAccountIntent<ExtraProps = undefined> = Intent<
  RenameLedgerAccountJobState,
  RenameLedgerAccountIntentInput,
  ExtraProps
>;
