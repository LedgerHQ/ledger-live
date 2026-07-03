import type { Intent, IntentDefinition, IntentPlatformDefinition } from "@ledgerhq/device-intent";

export type EvmAddress = `0x${string}`;
export type EvmChainId = number;
export type GroupHandle = string;
export type AddressBookProof = string;

export type AddressBookEvmJobStateBase =
  | { type: "pending" }
  | { type: "awaiting-device-confirmation" }
  | { type: "failed"; error: Error };

export type RegisterAddressBookExternalAddressEvmIntentInput = {
  contactName: string;
  scope: string;
  address: EvmAddress;
  chainId: EvmChainId;
  derivationPath: string;
  existingContactGroup?: {
    groupHandle: GroupHandle;
    hmacProof: AddressBookProof;
  };
};

export type RegisterAddressBookExternalAddressEvmResult = {
  mode: "newContactGroup" | "existingContactGroup";
  contactName: string;
  scope: string;
  address: EvmAddress;
  chainId: EvmChainId;
  derivationPath: string;
  groupHandle: GroupHandle;
  hmacProof: AddressBookProof;
  hmacRest: AddressBookProof;
};

export type RegisterAddressBookExternalAddressEvmJobState =
  | AddressBookEvmJobStateBase
  | {
      type: "completed";
      result: RegisterAddressBookExternalAddressEvmResult;
    };

export type RenameAddressBookContactEvmIntentInput = {
  previousContactName: string;
  newContactName: string;
  derivationPath: string;
  groupHandle: GroupHandle;
  hmacProof: AddressBookProof;
};

export type RenameAddressBookContactEvmResult = {
  previousContactName: string;
  contactName: string;
  derivationPath: string;
  groupHandle: GroupHandle;
  hmacProof: AddressBookProof;
};

export type RenameAddressBookContactEvmJobState =
  | AddressBookEvmJobStateBase
  | {
      type: "completed";
      result: RenameAddressBookContactEvmResult;
    };

export type EditAddressBookExternalAddressIdentifierEvmIntentInput = {
  contactName: string;
  scope: string;
  previousAddress: EvmAddress;
  newAddress: EvmAddress;
  chainId: EvmChainId;
  derivationPath: string;
  groupHandle: GroupHandle;
  hmacProof: AddressBookProof;
  hmacRest: AddressBookProof;
};

export type EditAddressBookExternalAddressIdentifierEvmResult = {
  contactName: string;
  scope: string;
  previousAddress: EvmAddress;
  address: EvmAddress;
  chainId: EvmChainId;
  derivationPath: string;
  groupHandle: GroupHandle;
  hmacProof: AddressBookProof;
  hmacRest: AddressBookProof;
};

export type EditAddressBookExternalAddressIdentifierEvmJobState =
  | AddressBookEvmJobStateBase
  | {
      type: "completed";
      result: EditAddressBookExternalAddressIdentifierEvmResult;
    };

export type EditAddressBookExternalAddressScopeEvmIntentInput = {
  contactName: string;
  previousScope: string;
  newScope: string;
  address: EvmAddress;
  chainId: EvmChainId;
  derivationPath: string;
  groupHandle: GroupHandle;
  hmacProof: AddressBookProof;
  hmacRest: AddressBookProof;
};

export type EditAddressBookExternalAddressScopeEvmResult = {
  contactName: string;
  previousScope: string;
  scope: string;
  address: EvmAddress;
  chainId: EvmChainId;
  derivationPath: string;
  groupHandle: GroupHandle;
  hmacProof: AddressBookProof;
  hmacRest: AddressBookProof;
};

export type EditAddressBookExternalAddressScopeEvmJobState =
  | AddressBookEvmJobStateBase
  | {
      type: "completed";
      result: EditAddressBookExternalAddressScopeEvmResult;
    };

export type EditAddressBookExternalAddressEvmStep = "identifier" | "scope";

export type EditAddressBookExternalAddressEvmIntentInput = {
  contactName: string;
  previousScope: string;
  newScope: string;
  previousAddress: EvmAddress;
  newAddress: EvmAddress;
  chainId: EvmChainId;
  derivationPath: string;
  groupHandle: GroupHandle;
  hmacProof: AddressBookProof;
  hmacRest: AddressBookProof;
};

export type EditAddressBookExternalAddressEvmResult = {
  appliedStep: EditAddressBookExternalAddressEvmStep;
  contactName: string;
  scope: string;
  address: EvmAddress;
  chainId: EvmChainId;
  derivationPath: string;
  groupHandle: GroupHandle;
  hmacProof: AddressBookProof;
  hmacRest: AddressBookProof;
};

export type EditAddressBookExternalAddressEvmJobState =
  | { type: "pending" }
  | {
      type: "awaiting-device-confirmation";
      step: EditAddressBookExternalAddressEvmStep;
    }
  | {
      type: "partial-result";
      result: EditAddressBookExternalAddressEvmResult;
    }
  | {
      type: "completed";
      appliedSteps: EditAddressBookExternalAddressEvmStep[];
      result: EditAddressBookExternalAddressEvmResult;
    }
  | {
      type: "failed";
      failedStep?: EditAddressBookExternalAddressEvmStep;
      error: Error;
    };

export type RegisterAddressBookLedgerAccountEvmIntentInput = {
  accountName: string;
  derivationPath: string;
  chainId: EvmChainId;
};

export type RegisterAddressBookLedgerAccountEvmResult = {
  accountName: string;
  derivationPath: string;
  chainId: EvmChainId;
  hmacProof: AddressBookProof;
};

export type RegisterAddressBookLedgerAccountEvmJobState =
  | AddressBookEvmJobStateBase
  | {
      type: "completed";
      result: RegisterAddressBookLedgerAccountEvmResult;
    };

export type RenameAddressBookLedgerAccountEvmIntentInput = {
  previousAccountName: string;
  newAccountName: string;
  derivationPath: string;
  chainId: EvmChainId;
  hmacProof: AddressBookProof;
};

export type RenameAddressBookLedgerAccountEvmResult = {
  previousAccountName: string;
  accountName: string;
  derivationPath: string;
  chainId: EvmChainId;
  hmacProof: AddressBookProof;
};

export type RenameAddressBookLedgerAccountEvmJobState =
  | AddressBookEvmJobStateBase
  | {
      type: "completed";
      result: RenameAddressBookLedgerAccountEvmResult;
    };

export type AddressBookEvmIntentJobState =
  | RegisterAddressBookExternalAddressEvmJobState
  | RenameAddressBookContactEvmJobState
  | EditAddressBookExternalAddressIdentifierEvmJobState
  | EditAddressBookExternalAddressScopeEvmJobState
  | EditAddressBookExternalAddressEvmJobState
  | RegisterAddressBookLedgerAccountEvmJobState
  | RenameAddressBookLedgerAccountEvmJobState;

export type AddressBookEvmIntentExtraProps = Record<string, never>;

export type RegisterAddressBookExternalAddressEvmIntentDefinition = IntentDefinition<
  RegisterAddressBookExternalAddressEvmJobState,
  RegisterAddressBookExternalAddressEvmIntentInput
>;

export type RegisterAddressBookExternalAddressEvmIntentPlatformDefinition =
  IntentPlatformDefinition<
    RegisterAddressBookExternalAddressEvmJobState,
    RegisterAddressBookExternalAddressEvmIntentInput,
    AddressBookEvmIntentExtraProps
  >;

export type RegisterAddressBookExternalAddressEvmIntent = Intent<
  RegisterAddressBookExternalAddressEvmJobState,
  RegisterAddressBookExternalAddressEvmIntentInput,
  AddressBookEvmIntentExtraProps
>;

export type RenameAddressBookContactEvmIntentDefinition = IntentDefinition<
  RenameAddressBookContactEvmJobState,
  RenameAddressBookContactEvmIntentInput
>;

export type RenameAddressBookContactEvmIntentPlatformDefinition = IntentPlatformDefinition<
  RenameAddressBookContactEvmJobState,
  RenameAddressBookContactEvmIntentInput,
  AddressBookEvmIntentExtraProps
>;

export type RenameAddressBookContactEvmIntent = Intent<
  RenameAddressBookContactEvmJobState,
  RenameAddressBookContactEvmIntentInput,
  AddressBookEvmIntentExtraProps
>;

export type EditAddressBookExternalAddressIdentifierEvmIntentDefinition = IntentDefinition<
  EditAddressBookExternalAddressIdentifierEvmJobState,
  EditAddressBookExternalAddressIdentifierEvmIntentInput
>;

export type EditAddressBookExternalAddressIdentifierEvmIntentPlatformDefinition =
  IntentPlatformDefinition<
    EditAddressBookExternalAddressIdentifierEvmJobState,
    EditAddressBookExternalAddressIdentifierEvmIntentInput,
    AddressBookEvmIntentExtraProps
  >;

export type EditAddressBookExternalAddressIdentifierEvmIntent = Intent<
  EditAddressBookExternalAddressIdentifierEvmJobState,
  EditAddressBookExternalAddressIdentifierEvmIntentInput,
  AddressBookEvmIntentExtraProps
>;

export type EditAddressBookExternalAddressScopeEvmIntentDefinition = IntentDefinition<
  EditAddressBookExternalAddressScopeEvmJobState,
  EditAddressBookExternalAddressScopeEvmIntentInput
>;

export type EditAddressBookExternalAddressScopeEvmIntentPlatformDefinition =
  IntentPlatformDefinition<
    EditAddressBookExternalAddressScopeEvmJobState,
    EditAddressBookExternalAddressScopeEvmIntentInput,
    AddressBookEvmIntentExtraProps
  >;

export type EditAddressBookExternalAddressScopeEvmIntent = Intent<
  EditAddressBookExternalAddressScopeEvmJobState,
  EditAddressBookExternalAddressScopeEvmIntentInput,
  AddressBookEvmIntentExtraProps
>;

export type EditAddressBookExternalAddressEvmIntentDefinition = IntentDefinition<
  EditAddressBookExternalAddressEvmJobState,
  EditAddressBookExternalAddressEvmIntentInput
>;

export type EditAddressBookExternalAddressEvmIntentPlatformDefinition = IntentPlatformDefinition<
  EditAddressBookExternalAddressEvmJobState,
  EditAddressBookExternalAddressEvmIntentInput,
  AddressBookEvmIntentExtraProps
>;

export type EditAddressBookExternalAddressEvmIntent = Intent<
  EditAddressBookExternalAddressEvmJobState,
  EditAddressBookExternalAddressEvmIntentInput,
  AddressBookEvmIntentExtraProps
>;

export type RegisterAddressBookLedgerAccountEvmIntentDefinition = IntentDefinition<
  RegisterAddressBookLedgerAccountEvmJobState,
  RegisterAddressBookLedgerAccountEvmIntentInput
>;

export type RegisterAddressBookLedgerAccountEvmIntentPlatformDefinition = IntentPlatformDefinition<
  RegisterAddressBookLedgerAccountEvmJobState,
  RegisterAddressBookLedgerAccountEvmIntentInput,
  AddressBookEvmIntentExtraProps
>;

export type RegisterAddressBookLedgerAccountEvmIntent = Intent<
  RegisterAddressBookLedgerAccountEvmJobState,
  RegisterAddressBookLedgerAccountEvmIntentInput,
  AddressBookEvmIntentExtraProps
>;

export type RenameAddressBookLedgerAccountEvmIntentDefinition = IntentDefinition<
  RenameAddressBookLedgerAccountEvmJobState,
  RenameAddressBookLedgerAccountEvmIntentInput
>;

export type RenameAddressBookLedgerAccountEvmIntentPlatformDefinition = IntentPlatformDefinition<
  RenameAddressBookLedgerAccountEvmJobState,
  RenameAddressBookLedgerAccountEvmIntentInput,
  AddressBookEvmIntentExtraProps
>;

export type RenameAddressBookLedgerAccountEvmIntent = Intent<
  RenameAddressBookLedgerAccountEvmJobState,
  RenameAddressBookLedgerAccountEvmIntentInput,
  AddressBookEvmIntentExtraProps
>;
