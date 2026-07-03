import { of } from "rxjs";
import type { Job } from "@ledgerhq/device-intent";
import type {
  AddressBookProof,
  EditAddressBookExternalAddressEvmIntentInput,
  EditAddressBookExternalAddressEvmJobState,
  EditAddressBookExternalAddressEvmResult,
  EditAddressBookExternalAddressEvmStep,
  EditAddressBookExternalAddressIdentifierEvmIntentInput,
  EditAddressBookExternalAddressIdentifierEvmJobState,
  EditAddressBookExternalAddressScopeEvmIntentInput,
  EditAddressBookExternalAddressScopeEvmJobState,
  GroupHandle,
  RegisterAddressBookExternalAddressEvmIntentInput,
  RegisterAddressBookExternalAddressEvmJobState,
  RegisterAddressBookLedgerAccountEvmIntentInput,
  RegisterAddressBookLedgerAccountEvmJobState,
  RenameAddressBookContactEvmIntentInput,
  RenameAddressBookContactEvmJobState,
  RenameAddressBookLedgerAccountEvmIntentInput,
  RenameAddressBookLedgerAccountEvmJobState,
} from "./types";

let sequence = 0;

function nextToken(prefix: string): string {
  sequence += 1;
  return `${prefix}:${sequence}`;
}

function nextAddressBookProof(prefix: string): AddressBookProof {
  return nextToken(`proof:${prefix}`);
}

function nextGroupHandle(contactName: string): GroupHandle {
  return `group:${contactName.toLowerCase().replace(/\s+/g, "-")}:${nextToken("dummy")}`;
}

export const registerAddressBookExternalAddressEvmIntentJob: Job<
  RegisterAddressBookExternalAddressEvmJobState,
  RegisterAddressBookExternalAddressEvmIntentInput
> = ({ input }) => {
  const groupHandle = input.existingContactGroup?.groupHandle ?? nextGroupHandle(input.contactName);
  const hmacProof = input.existingContactGroup?.hmacProof ?? nextAddressBookProof("name");

  return of(
    { type: "pending" } as const,
    { type: "awaiting-device-confirmation" } as const,
    {
      type: "completed",
      result: {
        mode: input.existingContactGroup ? "existingContactGroup" : "newContactGroup",
        contactName: input.contactName,
        scope: input.scope,
        address: input.address,
        chainId: input.chainId,
        derivationPath: input.derivationPath,
        groupHandle,
        hmacProof,
        hmacRest: nextAddressBookProof("addr"),
      },
    } as const,
  );
};

export const renameAddressBookContactEvmIntentJob: Job<
  RenameAddressBookContactEvmJobState,
  RenameAddressBookContactEvmIntentInput
> = ({ input }) =>
  of(
    { type: "pending" } as const,
    { type: "awaiting-device-confirmation" } as const,
    {
      type: "completed",
      result: {
        previousContactName: input.previousContactName,
        contactName: input.newContactName,
        derivationPath: input.derivationPath,
        groupHandle: input.groupHandle,
        hmacProof: nextAddressBookProof("name"),
      },
    } as const,
  );

export const editAddressBookExternalAddressIdentifierEvmIntentJob: Job<
  EditAddressBookExternalAddressIdentifierEvmJobState,
  EditAddressBookExternalAddressIdentifierEvmIntentInput
> = ({ input }) =>
  of(
    { type: "pending" } as const,
    { type: "awaiting-device-confirmation" } as const,
    {
      type: "completed",
      result: {
        contactName: input.contactName,
        scope: input.scope,
        previousAddress: input.previousAddress,
        address: input.newAddress,
        chainId: input.chainId,
        derivationPath: input.derivationPath,
        groupHandle: input.groupHandle,
        hmacProof: input.hmacProof,
        hmacRest: nextAddressBookProof("addr"),
      },
    } as const,
  );

export const editAddressBookExternalAddressScopeEvmIntentJob: Job<
  EditAddressBookExternalAddressScopeEvmJobState,
  EditAddressBookExternalAddressScopeEvmIntentInput
> = ({ input }) =>
  of(
    { type: "pending" } as const,
    { type: "awaiting-device-confirmation" } as const,
    {
      type: "completed",
      result: {
        contactName: input.contactName,
        previousScope: input.previousScope,
        scope: input.newScope,
        address: input.address,
        chainId: input.chainId,
        derivationPath: input.derivationPath,
        groupHandle: input.groupHandle,
        hmacProof: input.hmacProof,
        hmacRest: nextAddressBookProof("addr"),
      },
    } as const,
  );

function buildConvenienceResult(
  input: EditAddressBookExternalAddressEvmIntentInput,
  appliedStep: EditAddressBookExternalAddressEvmStep,
  hmacRest: AddressBookProof,
  address = input.newAddress,
  scope = input.newScope,
): EditAddressBookExternalAddressEvmResult {
  return {
    appliedStep,
    contactName: input.contactName,
    scope,
    address,
    chainId: input.chainId,
    derivationPath: input.derivationPath,
    groupHandle: input.groupHandle,
    hmacProof: input.hmacProof,
    hmacRest,
  };
}

export const editAddressBookExternalAddressEvmIntentJob: Job<
  EditAddressBookExternalAddressEvmJobState,
  EditAddressBookExternalAddressEvmIntentInput
> = ({ input }) => {
  const addressChanged = input.previousAddress !== input.newAddress;
  const scopeChanged = input.previousScope !== input.newScope;

  if (addressChanged && scopeChanged) {
    const intermediateHmacRest = nextAddressBookProof("addr");
    const finalHmacRest = nextAddressBookProof("addr");

    return of(
      { type: "pending" } as const,
      { type: "awaiting-device-confirmation", step: "identifier" } as const,
      {
        type: "partial-result",
        result: buildConvenienceResult(
          input,
          "identifier",
          intermediateHmacRest,
          input.newAddress,
          input.previousScope,
        ),
      } as const,
      { type: "awaiting-device-confirmation", step: "scope" } as const,
      {
        type: "completed",
        appliedSteps: ["identifier", "scope"],
        result: buildConvenienceResult(input, "scope", finalHmacRest),
      } as const,
    );
  }

  const appliedStep: EditAddressBookExternalAddressEvmStep = addressChanged
    ? "identifier"
    : "scope";

  return of(
    { type: "pending" } as const,
    { type: "awaiting-device-confirmation", step: appliedStep } as const,
    {
      type: "completed",
      appliedSteps: [appliedStep],
      result: buildConvenienceResult(input, appliedStep, nextAddressBookProof("addr")),
    } as const,
  );
};

export const registerAddressBookLedgerAccountEvmIntentJob: Job<
  RegisterAddressBookLedgerAccountEvmJobState,
  RegisterAddressBookLedgerAccountEvmIntentInput
> = ({ input }) =>
  of(
    { type: "pending" } as const,
    { type: "awaiting-device-confirmation" } as const,
    {
      type: "completed",
      result: {
        accountName: input.accountName,
        derivationPath: input.derivationPath,
        chainId: input.chainId,
        hmacProof: nextAddressBookProof("ledger"),
      },
    } as const,
  );

export const renameAddressBookLedgerAccountEvmIntentJob: Job<
  RenameAddressBookLedgerAccountEvmJobState,
  RenameAddressBookLedgerAccountEvmIntentInput
> = ({ input }) =>
  of(
    { type: "pending" } as const,
    { type: "awaiting-device-confirmation" } as const,
    {
      type: "completed",
      result: {
        previousAccountName: input.previousAccountName,
        accountName: input.newAccountName,
        derivationPath: input.derivationPath,
        chainId: input.chainId,
        hmacProof: nextAddressBookProof("ledger"),
      },
    } as const,
  );
