import { z } from "zod";

declare const opaqueStringBrand: unique symbol;

export type OpaqueString<Kind extends string> = string & {
  readonly [opaqueStringBrand]: Kind;
};

function createOpaqueStringSchema<Kind extends string>() {
  return z
    .string()
    .min(1)
    .transform(value => value as OpaqueString<Kind>);
}

export const ContactGroupHandleSchema = createOpaqueStringSchema<"ContactGroupHandle">();
export const ExternalContactNameProofSchema =
  createOpaqueStringSchema<"ExternalContactNameProof">();
export const ExternalAddressProofSchema = createOpaqueStringSchema<"ExternalAddressProof">();
export const LedgerAccountNameProofSchema = createOpaqueStringSchema<"LedgerAccountNameProof">();
export const BlockchainFamilySchema = createOpaqueStringSchema<"BlockchainFamily">();
export const DeviceChainIdSchema = z.union([z.string().min(1), z.number().finite()]);

export const DeviceContactGroupCredentialsSchema = z.object({
  groupHandle: ContactGroupHandleSchema,
  hmacProof: ExternalContactNameProofSchema,
});

export const ExternalAddressDeviceContextSchema = z.object({
  blockchainFamily: BlockchainFamilySchema,
  chainId: DeviceChainIdSchema,
  hmacRest: ExternalAddressProofSchema,
});

export type ContactGroupHandle = z.infer<typeof ContactGroupHandleSchema>;
export type ExternalContactNameProof = z.infer<typeof ExternalContactNameProofSchema>;
export type ExternalAddressProof = z.infer<typeof ExternalAddressProofSchema>;
export type LedgerAccountNameProof = z.infer<typeof LedgerAccountNameProofSchema>;
export type BlockchainFamily = z.infer<typeof BlockchainFamilySchema>;
export type DeviceChainId = z.infer<typeof DeviceChainIdSchema>;
export type DeviceContactGroupCredentials = z.infer<typeof DeviceContactGroupCredentialsSchema>;
export type ExternalAddressDeviceContext = z.infer<typeof ExternalAddressDeviceContextSchema>;
