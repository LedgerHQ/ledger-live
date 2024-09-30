import { transformData, getProvidersData, ProvidersDataResponse } from "./getProvidersData";
import network from "@ledgerhq/live-network";

type TransformedProviderData = {
  name: string;
  publicKey: {
    curve: string;
    data: Buffer;
  };
  signature: Buffer;
};

jest.mock("@ledgerhq/live-network");

describe("transformData", () => {
  it("should transform providers data correctly", () => {
    const providersData: ProvidersDataResponse = [
      {
        name: "ProviderA",
        signature: "a1b2c3",
        public_key: "1234567890abcdef",
        public_key_curve: "secp256k1",
      },
      {
        name: "ProviderB",
        signature: "d4e5f6",
        public_key: "abcdef1234567890",
        public_key_curve: "secp256r1",
      },
    ];

    const expected: Record<string, TransformedProviderData> = {
      providera: {
        name: "ProviderA",
        publicKey: {
          curve: "secp256k1",
          data: Buffer.from("1234567890abcdef", "hex"),
        },
        signature: Buffer.from("a1b2c3", "hex"),
      },
      providerb: {
        name: "ProviderB",
        publicKey: {
          curve: "secp256r1",
          data: Buffer.from("abcdef1234567890", "hex"),
        },
        signature: Buffer.from("d4e5f6", "hex"),
      },
    };

    const result = transformData(providersData);
    expect(result).toEqual(expected);
  });

  it("should handle empty providers data", () => {
    const providersData: ProvidersDataResponse = [];

    const expected: Record<string, TransformedProviderData> = {};

    const result = transformData(providersData);
    expect(result).toEqual(expected);
  });
});

describe("getProvidersData", () => {
  it("should fetch and transform providers data", async () => {
    const mockProvidersData: ProvidersDataResponse = [
      {
        name: "ProviderA",
        signature: "a1b2c3",
        public_key: "1234567890abcdef",
        public_key_curve: "secp256k1",
      },
    ];

    (network as jest.Mock).mockResolvedValue({ data: mockProvidersData });

    const result = await getProvidersData("someType");

    expect(network).toHaveBeenCalledWith({
      method: "GET",
      url: "https://crypto-assets-service.api.ledger.com/v1/partners",
      params: {
        output: "name,signature,public_key,public_key_curve",
        service_name: "someType",
      },
    });

    expect(result).toEqual({
      providera: {
        name: "ProviderA",
        publicKey: {
          curve: "secp256k1",
          data: Buffer.from("1234567890abcdef", "hex"),
        },
        signature: Buffer.from("a1b2c3", "hex"),
      },
    });
  });

  it("should handle errors when fetching data", async () => {
    (network as jest.Mock).mockRejectedValue(new Error("Network error"));

    await expect(getProvidersData("someType")).rejects.toThrow("Network error");
  });
});
