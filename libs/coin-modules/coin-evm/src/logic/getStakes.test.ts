// import BigNumber from "bignumber.js";
// import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
// import * as nodeModule from "../network/node";
// import { getStakes } from ".";

// describe("getStakes", () => {
//   it("returns staking position when balance exists", async () => {
//     jest.spyOn(nodeModule, "getNodeApi").mockReturnValue({
//       getCoinBalance: jest.fn().mockResolvedValue(new BigNumber("5000000000000000000000")),
//     } as any);

//     const result = await getStakes({} as CryptoCurrency, "test-address");
//     expect(result).toEqual([
//       {
//         uid: "test-address",
//         address: "test-address",
//         state: "active",
//         asset: { type: "native" },
//         amount: BigInt("5000000000000000000000"),
//       },
//     ]);
//   });

//   it("returns empty array when balance is zero", async () => {
//     jest.spyOn(nodeModule, "getNodeApi").mockReturnValue({
//       getCoinBalance: jest.fn().mockResolvedValue(new BigNumber("0")),
//     } as any);

//     const result = await getStakes({} as CryptoCurrency, "test-address");
//     expect(result).toEqual([]);
//   });

//   it("returns empty array when API call fails", async () => {
//     jest.spyOn(nodeModule, "getNodeApi").mockReturnValue({
//       getCoinBalance: jest.fn().mockRejectedValue(new Error("API Error")),
//     } as any);

//     const result = await getStakes({} as CryptoCurrency, "test-address");
//     expect(result).toEqual([]);
//   });
// });
