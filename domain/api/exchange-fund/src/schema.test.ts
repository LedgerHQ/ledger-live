import { ExchangeProviderSignatureSchema, FundRemitResponseSchema } from "./schema";

const remitResponse = {
  sellId: "5b8e7f2c-6c39-4f0e-9d5a-2f6d1b0c7a91",
  payinAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
  providerSig: {
    payload: "CgtjYXJkLXVzZXItMRIJQ2FyZCAxMjM0",
    signature: "MEUCIQDXK5Z9hQ0nJ3f2p1lRr8yVQe6mVYh4tXlA2c8Kk9rWpAIgH1s",
  },
};

describe("FundRemitResponseSchema", () => {
  it("reads the remit response", () => {
    expect(FundRemitResponseSchema.parse(remitResponse)).toEqual(remitResponse);
  });

  it("drops the keys the wire contract does not declare", () => {
    const parsed = FundRemitResponseSchema.parse({
      ...remitResponse,
      createdAt: "2026-08-26T09:00:00.000Z",
      providerFees: "0.1",
    });

    expect(parsed).toEqual(remitResponse);
  });

  it("rejects an empty payin address", () => {
    expect(() => FundRemitResponseSchema.parse({ ...remitResponse, payinAddress: "" })).toThrow();
  });

  it("rejects a signature with no payload to verify", () => {
    expect(() =>
      FundRemitResponseSchema.parse({
        ...remitResponse,
        providerSig: { payload: "", signature: remitResponse.providerSig.signature },
      }),
    ).toThrow();
  });
});

describe("ExchangeProviderSignatureSchema", () => {
  it("keeps the payload and signature as the strings the device checks", () => {
    expect(ExchangeProviderSignatureSchema.parse(remitResponse.providerSig)).toEqual(
      remitResponse.providerSig,
    );
  });
});
