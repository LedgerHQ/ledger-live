import network from "@ledgerhq/live-common/network";
import { resolveAddress, resolveDomain } from "../../resolvers";

jest.mock("@ledgerhq/live-common/network");
const mockedNetwork = jest.mocked(network);

describe("Domain Service", () => {
  describe("Resolvers", () => {
    describe("resolveDomain", () => {
      beforeEach(() => {
        jest.restoreAllMocks();
        mockedNetwork.mockImplementation(async ({ url }) => {
          if (url?.endsWith("vitalik.eth")) {
            return { data: "0x123" } as any;
          }
          return Promise.reject({ response: { status: 404 } }) as any;
        });
      });

      it("should resolve a ENS domain by inferring the registries", async () => {
        const resolutions = await resolveDomain("vitalik.eth");
        expect(resolutions).toEqual([
          { registry: "ens", address: "0x123", domain: "vitalik.eth" },
        ]);
      });

      it("should resolve a ENS domain by specifying the registry", async () => {
        const resolutions = await resolveDomain("vitalik.eth", "ens");
        expect(resolutions).toEqual([
          { registry: "ens", address: "0x123", domain: "vitalik.eth" },
        ]);
      });

      it("should fail at resolving a non existing ENS domain", async () => {
        const resolutions = await resolveDomain("anything.eth");
        expect(resolutions).toEqual([]);
      });
    });

    describe("resolveAddress", () => {
      beforeEach(() => {
        jest.restoreAllMocks();
        mockedNetwork.mockImplementation(async ({ url }) => {
          if (url?.endsWith("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")) {
            return { data: "vitalik.eth" } as any;
          }
          return Promise.reject({ response: { status: 404 } }) as any;
        });
      });

      it("should resolve an address with a reverse record ENS by inferring registries", async () => {
        const resolutions = await resolveAddress(
          "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
        );
        expect(resolutions).toEqual([
          {
            registry: "ens",
            domain: "vitalik.eth",
            address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
          },
        ]);
      });

      it("should resolve an address with a reverse record ENS by specify registry", async () => {
        const resolutions = await resolveAddress(
          "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
          "ens"
        );
        expect(resolutions).toEqual([
          {
            registry: "ens",
            domain: "vitalik.eth",
            address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
          },
        ]);
      });

      it("should fail at resolving an address without reverse record ENS", async () => {
        const resolutions = await resolveAddress("0x123");
        expect(resolutions).toEqual([]);
      });
    });
  });
});
