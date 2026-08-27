import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";

type ChainId = string | number;
type BlockchainFamily = string;
type Proof = string;

export type RegisterLedgerAccountIntentInput = Readonly<{
  accountName: string;
  derivationPath: string;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
}>;

export type RegisterLedgerAccountResult = Readonly<{
  accountName: string;
  derivationPath: string;
  blockchainFamily: BlockchainFamily;
  chainId: ChainId;
  hmacProof: Proof;
}>;

export type RegisterLedgerAccountJobState =
  | { readonly type: "pending" }
  | { readonly type: "awaiting-device-confirmation" }
  | { readonly type: "completed"; readonly result: RegisterLedgerAccountResult }
  | { readonly type: "failed"; readonly error: Error };

export type RegisterLedgerAccountIntentDefinition = IntentDefinition<
  RegisterLedgerAccountJobState,
  RegisterLedgerAccountIntentInput
>;

export type RegisterLedgerAccountIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    RegisterLedgerAccountJobState,
    RegisterLedgerAccountIntentInput,
    ExtraProps
  >;

export type RegisterLedgerAccountIntent<ExtraProps = undefined> = Intent<
  RegisterLedgerAccountJobState,
  RegisterLedgerAccountIntentInput,
  ExtraProps
>;
