import axios from "axios";
import { resolveAddress, resolveDomain } from "../../resolvers";

jest.mock("axios");
const mockedAxios = jest.mocked(axios);

describe("Domain Service", () => {
  describe("Resolvers", () => {
    describe("resolveDomain", () => {
      beforeEach(() => {
        jest.restoreAllMocks();
        jest.spyOn(mockedAxios, "request").mockImplementation(async ({ url }: { url: string }) => {
          if (url?.endsWith("vitalik.eth")) {
            return { data: "0x123" } as any;
          }
          return Promise.reject({ response: { status: 404 } }) as any;
        });
      });

      it("should resolve a ENS domain by inferring the registries", async () => {
        const resolutions = await resolveDomain("vitalik.eth");
        expect(resolutions).toEqual([
          {
            registry: "ens",
            address: "0x123",
            domain: "vitalik.eth",
            type: "forward",
          },
        ]);
      });

      it("should resolve a ENS domain by specifying the registry", async () => {
        const resolutions = await resolveDomain("vitalik.eth", "ens");
        expect(resolutions).toEqual([
          {
            registry: "ens",
            address: "0x123",
            domain: "vitalik.eth",
            type: "forward",
          },
        ]);
      });

      it("should fail at resolving a non existing ENS domain", async () => {
        const resolutions = await resolveDomain("anything.eth");
        expect(resolutions).toEqual([]);
      });
    });

    describe("resolveDomain (SNS)", () => {
      beforeEach(() => {
        jest.restoreAllMocks();
        jest.spyOn(mockedAxios, "request").mockImplementation(async ({ url }: { url: string }) => {
          if (url?.endsWith("chris.sol")) {
            return { data: "66JX9aK3DSe7cKhnEhsxfudnwhCsFGQ7Eseg7NRoUpEE" } as any;
          }
          return Promise.reject({ response: { status: 404 } }) as any;
        });
      });

      it("should resolve a SNS domain by inferring the registries", async () => {
        const resolutions = await resolveDomain("chris.sol");
        expect(resolutions).toEqual([
          {
            registry: "sns",
            address: "66JX9aK3DSe7cKhnEhsxfudnwhCsFGQ7Eseg7NRoUpEE",
            domain: "chris.sol",
            type: "forward",
          },
        ]);
      });

      it("should resolve a SNS domain by specifying the registry", async () => {
        const resolutions = await resolveDomain("chris.sol", "sns");
        expect(resolutions).toEqual([
          {
            registry: "sns",
            address: "66JX9aK3DSe7cKhnEhsxfudnwhCsFGQ7Eseg7NRoUpEE",
            domain: "chris.sol",
            type: "forward",
          },
        ]);
      });

      it("should return base58 address without eip55 corruption", async () => {
        const resolutions = await resolveDomain("chris.sol");
        expect(resolutions[0].address).toBe("66JX9aK3DSe7cKhnEhsxfudnwhCsFGQ7Eseg7NRoUpEE");
      });

      it("should fail at resolving a non existing SNS domain", async () => {
        const resolutions = await resolveDomain("nonexistent.sol");
        expect(resolutions).toEqual([]);
      });
    });

    describe("resolveAddress", () => {
      beforeEach(() => {
        jest.restoreAllMocks();
        jest.spyOn(mockedAxios, "request").mockImplementation(async ({ url }: { url: string }) => {
          if (url?.endsWith("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")) {
            return { data: "vitalik.eth" } as any;
          }
          return Promise.reject({ response: { status: 404 } }) as any;
        });
      });

      it("should resolve an address with a reverse record ENS by inferring registries", async () => {
        const resolutions = await resolveAddress("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
        expect(resolutions).toEqual([
          {
            registry: "ens",
            domain: "vitalik.eth",
            address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            type: "reverse",
          },
        ]);
      });

      it("should resolve an address with a reverse record ENS by specify registry", async () => {
        const resolutions = await resolveAddress(
          "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
          "ens",
        );
        expect(resolutions).toEqual([
          {
            registry: "ens",
            domain: "vitalik.eth",
            address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            type: "reverse",
          },
        ]);
      });

      it("should fail at resolving an address without reverse record ENS", async () => {
        const resolutions = await resolveAddress("0x123");
        expect(resolutions).toEqual([]);
      });
    });

    describe("resolveAddress (SNS)", () => {
      beforeEach(() => {
        jest.restoreAllMocks();
        jest.spyOn(mockedAxios, "request").mockImplementation(async ({ url }: { url: string }) => {
          if (url?.endsWith("66JX9aK3DSe7cKhnEhsxfudnwhCsFGQ7Eseg7NRoUpEE")) {
            return { data: "chris.sol" } as any;
          }
          return Promise.reject({ response: { status: 404 } }) as any;
        });
      });

      it("should resolve a Solana address with a reverse record SNS by inferring registries", async () => {
        const resolutions = await resolveAddress("66JX9aK3DSe7cKhnEhsxfudnwhCsFGQ7Eseg7NRoUpEE");
        expect(resolutions).toEqual([
          {
            registry: "sns",
            domain: "chris.sol",
            address: "66JX9aK3DSe7cKhnEhsxfudnwhCsFGQ7Eseg7NRoUpEE",
            type: "reverse",
          },
        ]);
      });

      it("should resolve a Solana address with a reverse record SNS by specifying registry", async () => {
        const resolutions = await resolveAddress(
          "66JX9aK3DSe7cKhnEhsxfudnwhCsFGQ7Eseg7NRoUpEE",
          "sns",
        );
        expect(resolutions).toEqual([
          {
            registry: "sns",
            domain: "chris.sol",
            address: "66JX9aK3DSe7cKhnEhsxfudnwhCsFGQ7Eseg7NRoUpEE",
            type: "reverse",
          },
        ]);
      });
    });
  });
});
