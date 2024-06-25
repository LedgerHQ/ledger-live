import { TransactionContext } from "../../shared/model/TransactionContext";
import { NftDataSource } from "../data/NftDataSource";
import { NftContextLoader } from "./NftContextLoader";

describe("NftContextLoader", () => {
  const spyGetNftInfosPayload = jest.fn();
  const spyGetPluginPayload = jest.fn();
  let mockDataSource: NftDataSource;
  let loader: NftContextLoader;

  beforeEach(() => {
    jest.restoreAllMocks();
    mockDataSource = {
      getNftInfosPayload: spyGetNftInfosPayload,
      getSetPluginPayload: spyGetPluginPayload,
    };
    loader = new NftContextLoader(mockDataSource);
  });

  describe("load function", () => {
    it("should return an empty array if no dest", async () => {
      const transaction = { to: undefined, data: "0x01" } as TransactionContext;

      const result = await loader.load(transaction);

      expect(result).toEqual([]);
    });

    it("should return an empty array if undefined data", async () => {
      const transaction = {
        to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        data: undefined,
      } as unknown as TransactionContext;

      const result = await loader.load(transaction);

      expect(result).toEqual([]);
    });

    it("should return an empty array if empty data", async () => {
      const transaction = {
        to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        data: "0x",
      } as unknown as TransactionContext;

      const result = await loader.load(transaction);

      expect(result).toEqual([]);
    });

    it("should return an empty array if selector not supported", async () => {
      const transaction = {
        to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        data: "0x095ea7b20000000000000",
      } as unknown as TransactionContext;

      const result = await loader.load(transaction);

      expect(result).toEqual([]);
    });

    it("should return an error when no plugin response", async () => {
      const transaction = {
        to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        data: "0x095ea7b30000000000000",
      } as unknown as TransactionContext;
      spyGetPluginPayload.mockResolvedValueOnce(undefined);

      const result = await loader.load(transaction);

      expect(result).toEqual([
        expect.objectContaining({
          type: "error" as const,
          error: new Error("[ContextModule] NftLoader: unexpected empty response"),
        }),
      ]);
    });

    it("should return an error when no nft data response", async () => {
      const transaction = {
        to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        data: "0x095ea7b30000000000000",
      } as unknown as TransactionContext;
      spyGetPluginPayload.mockResolvedValueOnce("payload1");
      spyGetNftInfosPayload.mockResolvedValueOnce(undefined);

      const result = await loader.load(transaction);

      expect(result).toEqual([
        expect.objectContaining({
          type: "error" as const,
          error: new Error("[ContextModule] NftLoader: no nft metadata"),
        }),
      ]);
    });

    it("should return a response", async () => {
      const transaction = {
        to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        data: "0x095ea7b30000000000000",
      } as unknown as TransactionContext;
      spyGetPluginPayload.mockResolvedValueOnce("payload1");
      spyGetNftInfosPayload.mockResolvedValueOnce("payload2");

      const result = await loader.load(transaction);

      expect(result).toEqual([
        {
          type: "setPlugin" as const,
          payload: "payload1",
        },
        {
          type: "provideNFTInformation" as const,
          payload: "payload2",
        },
      ]);
    });
  });
});
