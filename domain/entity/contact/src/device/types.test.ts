import {
  DeviceContactGroupCredentialsSchema,
  ExternalAddressDeviceContextSchema,
  LedgerAccountNameProofSchema,
} from "./types";

describe("Contacts Device Intent types", () => {
  it("should parse reusable opaque device credentials", () => {
    expect(
      DeviceContactGroupCredentialsSchema.parse({
        groupHandle: "device-group-handle",
        hmacProof: "external-contact-name-proof",
      }),
    ).toEqual({
      groupHandle: "device-group-handle",
      hmacProof: "external-contact-name-proof",
    });
  });

  it("should parse an external address device context", () => {
    expect(
      ExternalAddressDeviceContextSchema.parse({
        blockchainFamily: "ethereum",
        chainId: 1,
        hmacRest: "external-address-proof",
      }),
    ).toEqual({
      blockchainFamily: "ethereum",
      chainId: 1,
      hmacRest: "external-address-proof",
    });
  });

  it("should keep Ledger account proofs in a separate proof domain", () => {
    expect(LedgerAccountNameProofSchema.parse("ledger-account-name-proof")).toBe(
      "ledger-account-name-proof",
    );
  });
});
