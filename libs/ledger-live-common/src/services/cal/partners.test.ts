import {
  transformData,
  getProvidersData,
  type ProvidersDataResponse,
  type ExchangeProvider,
} from "./partners";
import network from "@ledgerhq/live-network";

jest.mock("@ledgerhq/live-network");

const test = "test" as "prod" | "test";
const prod = "prod" as "prod" | "test";

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe("transformData", () => {
  it.each([
    [
      prod,
      {
        providera: {
          name: "ProviderA",
          publicKey: {
            curve: "secp256k1",
            data: Buffer.from("1234567890abcdef", "hex"),
          },
          signature: Buffer.from("a1b2c3", "hex"),
          version: 2,
        } satisfies ExchangeProvider,
        providerb: {
          name: "ProviderB",
          publicKey: {
            curve: "secp256r1",
            data: Buffer.from("abcdef1234567890", "hex"),
          },
          signature: Buffer.from("d4e5f6", "hex"),
          version: 2,
        } satisfies ExchangeProvider,
      },
    ],
    [
      test,
      {
        providera: {
          name: "ProviderA",
          publicKey: {
            curve: "secp256k1",
            data: Buffer.from("1234567890abcdef", "hex"),
          },
          signature: Buffer.from("d1e2f3", "hex"),
          version: 2,
        } satisfies ExchangeProvider,
        providerb: {
          name: "ProviderB",
          publicKey: {
            curve: "secp256r1",
            data: Buffer.from("abcdef1234567890", "hex"),
          },
          signature: Buffer.from("a9b8c7", "hex"),
          version: 2,
        } satisfies ExchangeProvider,
      },
    ],
  ])(
    "should transform providers data correctly with %p Ledger signature env",
    (ledgerSignatureEnv: "prod" | "test", expected: Record<string, ExchangeProvider>) => {
      const providersData = [
        {
          name: "ProviderA",
          partner_id: "providera",
          public_key: "1234567890abcdef",
          public_key_curve: "secp256k1",
          service_app_version: 2,
          descriptor: {
            data: "09abcd",
            signatures: {
              prod: "a1b2c3",
              test: "d1e2f3",
            },
          },
        },
        {
          name: "ProviderB",
          partner_id: "providerb",
          public_key: "abcdef1234567890",
          public_key_curve: "secp256r1",
          service_app_version: 2,
          descriptor: {
            data: "ef0123",
            signatures: {
              prod: "d4e5f6",
              test: "a9b8c7",
            },
          },
        },
      ];

      const result = transformData(providersData, ledgerSignatureEnv);
      expect(result).toEqual(expected);
    },
  );

  it("should handle empty providers data", () => {
    const providersData: ProvidersDataResponse = [];

    const expected: Record<string, ExchangeProvider> = {};

    const result = transformData(providersData);
    expect(result).toEqual(expected);
  });
});

describe("getProvidersData", () => {
  it.each([
    [
      prod,
      prod,
      {
        providera: {
          name: "ProviderA",
          publicKey: {
            curve: "secp256k1",
            data: Buffer.from("1234567890abcdef", "hex"),
          },
          signature: Buffer.from("a1b2c3", "hex"),
          version: 2,
        } satisfies ExchangeProvider,
      },
    ],
    [
      prod,
      test,
      {
        providera: {
          name: "ProviderA",
          publicKey: {
            curve: "secp256k1",
            data: Buffer.from("1234567890abcdef", "hex"),
          },
          signature: Buffer.from("a1b2c3", "hex"),
          version: 2,
        } satisfies ExchangeProvider,
      },
    ],
    [
      test,
      test,
      {
        providera: {
          name: "ProviderA",
          publicKey: {
            curve: "secp256k1",
            data: Buffer.from("1234567890abcdef", "hex"),
          },
          signature: Buffer.from("d1e2f3", "hex"),
          version: 2,
        } satisfies ExchangeProvider,
      },
    ],
    [
      test,
      prod,
      {
        providera: {
          name: "ProviderA",
          publicKey: {
            curve: "secp256k1",
            data: Buffer.from("1234567890abcdef", "hex"),
          },
          signature: Buffer.from("d1e2f3", "hex"),
          version: 2,
        } satisfies ExchangeProvider,
      },
    ],
  ])(
    "should fetch and transform providers data with %p Ledger signature env and %p partner signature",
    async (
      ledgerSignatureEnv: "prod" | "test",
      partnerSignatureEnv: "prod" | "test",
      expected: Record<string, ExchangeProvider>,
    ) => {
      const mockProvidersData: ProvidersDataResponse = [
        {
          name: "ProviderA",
          partner_id: "providera",
          public_key: "1234567890abcdef",
          public_key_curve: "secp256k1",
          service_app_version: 2,
          descriptor: {
            data: "09abcd",
            signatures: {
              prod: "a1b2c3",
              test: "d1e2f3",
            },
          },
        },
      ];

      (network as jest.Mock).mockResolvedValue({ data: mockProvidersData });

      const result = await getProvidersData({
        type: "swap",
        ledgerSignatureEnv,
        partnerSignatureEnv,
      });

      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: "https://crypto-assets-service.api.ledger.com/v1/partners",
        params: {
          env: partnerSignatureEnv,
          output: "name,public_key,public_key_curve,service_app_version,descriptor,partner_id,env",
          service_name: "swap",
        },
      });

      expect(result).toEqual(expected);
    },
  );

  it("should handle errors when fetching data", async () => {
    (network as jest.Mock).mockRejectedValue(new Error("Network error"));

    await expect(getProvidersData({ type: "swap" })).rejects.toThrow("Network error");
  });
});
