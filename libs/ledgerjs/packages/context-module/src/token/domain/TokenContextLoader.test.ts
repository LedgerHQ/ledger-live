import { TransactionContext } from "../../shared/model/TransactionContext";
import { TokenDataSource } from "../data/TokenDataSource";
import { TokenContextLoader } from "./TokenContextLoader";

describe("TokenContextLoader", () => {
  const mockTokenDataSource: TokenDataSource = { getTokenInfosPayload: jest.fn() };
  const loader = new TokenContextLoader(mockTokenDataSource);

  beforeEach(() => {
    jest.restoreAllMocks();
    jest
      .spyOn(mockTokenDataSource, "getTokenInfosPayload")
      .mockImplementation(({ address }) => Promise.resolve(`payload-${address}`));
  });

  describe("load function", () => {
    it("should return an empty array if transaction dest is undefined", async () => {
      // GIVEN
      const transaction = { to: undefined, data: "0x01" } as TransactionContext;

      // WHEN
      const result = await loader.load(transaction);

      // THEN
      expect(result).toEqual([]);
    });

    it("should return an empty array if transaction data is undefined", async () => {
      // GIVEN
      const transaction = {
        to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        data: undefined,
      } as unknown as TransactionContext;

      // WHEN
      const result = await loader.load(transaction);

      // THEN
      expect(result).toEqual([]);
    });

    it("should return an empty array if transaction data is empty", async () => {
      // GIVEN
      const transaction = {
        to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        data: "0x",
      } as TransactionContext;

      // WHEN
      const result = await loader.load(transaction);

      // THEN
      expect(result).toEqual([]);
    });

    it("should return an empty array if the selector is not supported", async () => {
      // GIVEN
      const transaction = {
        to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        data: "0x095ea7b20000000000000",
      } as unknown as TransactionContext;

      // WHEN
      const result = await loader.load(transaction);

      // THEN
      expect(result).toEqual([]);
    });

    it("should return undefined if the token is not supported by the CAL service", async () => {
      // GIVEN
      const transaction = {
        to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        data: "0x095ea7b30000000000",
        chainId: 1,
      } as TransactionContext;
      jest.spyOn(mockTokenDataSource, "getTokenInfosPayload").mockResolvedValue(undefined);

      // WHEN
      const result = await loader.load(transaction);

      // THEN
      expect(result).toEqual([]);
    });

    it("should return a correct response", async () => {
      // GIVEN
      const transaction = {
        to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        data: "0x095ea7b30000000000",
        chainId: 1,
      } as TransactionContext;

      // WHEN
      const result = await loader.load(transaction);

      // THEN
      expect(result).toEqual([
        {
          type: "provideERC20TokenInformation",
          payload: "payload-0xdAC17F958D2ee523a2206206994597C13D831ec7",
        },
      ]);
    });
  });
});
