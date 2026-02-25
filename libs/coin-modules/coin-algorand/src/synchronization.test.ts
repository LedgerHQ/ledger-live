import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import BigNumber from "bignumber.js";
import api from "./api";
import { getAccountShape } from "./synchronization";

describe("Synchronization", () => {
  beforeAll(() => {
    setCryptoAssetsStore({
      findTokenById: async (id: string) => {
        switch (id) {
          case "algorand/asa/1":
            return { id, ticker: "USDC" };
          case "algorand/asa/2":
            return { id, ticker: "USDT" };
          default:
            return undefined;
        }
      },
    } as any);
  });

  describe("getAccountShape", () => {
    it("preserves the order of existing token accounts", async () => {
      jest.spyOn(api, "getAccount").mockResolvedValue({
        balance: new BigNumber(10),
        assets: [
          { assetId: "1", balance: new BigNumber(4) },
          { assetId: "2", balance: new BigNumber(5) },
        ],
      } as any);
      jest.spyOn(api, "getAccountTransactions").mockResolvedValue([]);

      const result = await getAccountShape(
        {
          address: "address",
          initialAccount: {
            subAccounts: [
              {
                id: "js:2:algorand:address:+2",
                type: "TokenAccount",
                token: { id: "algorand/asa/2", ticker: "USDT" },
              },
              {
                id: "js:2:algorand:address:+1",
                type: "TokenAccount",
                token: { id: "algorand/asa/1", ticker: "USDC" },
              },
            ],
          },
          currency: { id: "algorand" },
          derivationMode: "",
        } as any,
        {} as any,
      );

      expect(result).toMatchObject({
        id: "js:2:algorand:address:",
        xpub: "address",
        balance: new BigNumber(10),
        subAccounts: [
          expect.objectContaining({ id: "js:2:algorand:address:+2" }),
          expect.objectContaining({ id: "js:2:algorand:address:+1" }),
        ],
      });
    });

    it("uses the order of input assets if no token accounts exist yet", async () => {
      jest.spyOn(api, "getAccount").mockResolvedValue({
        balance: new BigNumber(10),
        assets: [
          { assetId: "1", balance: new BigNumber(4) },
          { assetId: "2", balance: new BigNumber(5) },
        ],
      } as any);
      jest.spyOn(api, "getAccountTransactions").mockResolvedValue([]);

      const result = await getAccountShape(
        {
          address: "address",
          initialAccount: {
            subAccounts: [],
          },
          currency: { id: "algorand" },
          derivationMode: "",
        } as any,
        {} as any,
      );

      expect(result).toMatchObject({
        id: "js:2:algorand:address:",
        xpub: "address",
        balance: new BigNumber(10),
        subAccounts: [
          expect.objectContaining({ id: "js:2:algorand:address:+1" }),
          expect.objectContaining({ id: "js:2:algorand:address:+2" }),
        ],
      });
    });
  });
});
