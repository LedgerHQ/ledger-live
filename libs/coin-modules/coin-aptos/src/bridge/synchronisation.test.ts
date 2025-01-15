// import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
// import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
// import { Account, SyncConfig } from "@ledgerhq/types-live";
// import { firstValueFrom } from "rxjs";
// import { decodeAccountId } from "@ledgerhq/coin-framework/account";
// import { makeScanAccounts, makeSync, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
// import { AptosAPI } from "./api";
// import { txsToOps } from "./logic";
// import { getAccountShape } from "./synchronisation";

// jest.mock("rxjs");
// let mockedFistValueFrom;

// jest.mock("@ledgerhq/coin-framework/account");
// let mockedDecodeAccountId;

// jest.mock("./api");
// let mockedAptosAPI;

// jest.mock("./logic");
// jest.mocked(txsToOps);

// jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers");
// jest.mocked(makeScanAccounts);
// jest.mocked(makeSync);

// describe("getAccountShape", () => {
//   beforeEach(() => {
//     mockedAptosAPI = jest.mocked(AptosAPI);

//     mockedDecodeAccountId = jest.mocked(decodeAccountId).mockReturnValue({
//       currencyId: "aptos",
//       derivationMode: "",
//       type: "js",
//       version: "1",
//       xpubOrAddress: "address",
//     });

//     mockedFistValueFrom = jest
//       .mocked(firstValueFrom)
//       .mockImplementation(async () => ({ publicKey: "publicKey" }));

//     jest.mocked(mergeOps).mockReturnValue([]);
//   });

//   afterEach(() => {
//     jest.resetAllMocks();
//   });

//   it("get xpub from device id", async () => {
//     const mockGetAccountInfo = jest.fn().mockImplementation(async () => ({
//       balance: BigInt(0),
//       transactions: [],
//       blockHeight: 0,
//     }));
//     mockedAptosAPI.mockImplementation(() => ({
//       getAccountInfo: mockGetAccountInfo,
//     }));
//     const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

//     const account = await getAccountShape(
//       {
//         id: "1",
//         address: "address",
//         currency: getCryptoCurrencyById("aptos"),
//         derivationMode: "",
//         index: 0,
//         xpub: "address",
//         derivationPath: "",
//         deviceId: "1",
//         initialAccount: {
//           id: "1:1:1:1:1",
//           // xpub: "address",
//           seedIdentifier: "1",
//           derivationMode: "",
//           index: 0,
//           freshAddress: "address",
//           freshAddressPath: "",
//           used: true,
//           balance: BigInt(10),
//           spendableBalance: BigInt(10),
//           creationDate: new Date(),
//           blockHeight: 0,
//           currency: getCryptoCurrencyById("aptos"),
//           operationsCount: 0,
//           operations: [],
//           pendingOperations: [],
//           lastSyncDate: new Date(),
//           balanceHistoryCache: {},
//           swapHistory: [],
//         },
//       } as unknown as AccountShapeInfo<Account>,
//       {} as SyncConfig,
//     );

//     expect(account.xpub).toEqual("7075626c69634b6579");
//     expect(mockedFistValueFrom).toHaveBeenCalledTimes(1);
//     expect(mockedDecodeAccountId).toHaveBeenCalledTimes(0);
//     expect(mockedAptosAPI).toHaveBeenCalledTimes(1);
//     expect(mockGetAccountSpy).toHaveBeenCalledWith("address", undefined);
//   });

//   it("get xpub from device id when there is no initial account", async () => {
//     const mockGetAccountInfo = jest.fn().mockImplementation(async () => ({
//       balance: BigInt(0),
//       transactions: [],
//       blockHeight: 0,
//     }));
//     mockedAptosAPI.mockImplementation(() => ({
//       getAccountInfo: mockGetAccountInfo,
//     }));
//     const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

//     const account = await getAccountShape(
//       {
//         id: "1",
//         address: "address",
//         currency: getCryptoCurrencyById("aptos"),
//         derivationMode: "",
//         index: 0,
//         xpub: "address",
//         derivationPath: "",
//         deviceId: "1",
//       } as unknown as AccountShapeInfo<Account>,
//       {} as SyncConfig,
//     );

//     expect(account.xpub).toEqual("7075626c69634b6579");
//     expect(mockedFistValueFrom).toHaveBeenCalledTimes(1);
//     expect(mockedDecodeAccountId).toHaveBeenCalledTimes(0);
//     expect(mockedAptosAPI).toHaveBeenCalledTimes(1);
//     expect(mockGetAccountSpy).toHaveBeenCalledWith("address", undefined);
//   });

//   it("get xpub from initial account id", async () => {
//     const mockGetAccountInfo = jest.fn().mockImplementation(async () => ({
//       balance: BigInt(0),
//       transactions: [],
//       blockHeight: 0,
//     }));
//     mockedAptosAPI.mockImplementation(() => ({
//       getAccountInfo: mockGetAccountInfo,
//     }));
//     const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

//     const account = await getAccountShape(
//       {
//         id: "1",
//         address: "address",
//         currency: getCryptoCurrencyById("aptos"),
//         derivationMode: "",
//         index: 0,
//         xpub: "address",
//         derivationPath: "",
//         // deviceId: "1",
//         initialAccount: {
//           id: "1:1:1:1:1",
//           // xpub: "address",
//           seedIdentifier: "1",
//           derivationMode: "",
//           index: 0,
//           freshAddress: "address",
//           freshAddressPath: "",
//           used: true,
//           balance: BigInt(10),
//           spendableBalance: BigInt(10),
//           creationDate: new Date(),
//           blockHeight: 0,
//           currency: getCryptoCurrencyById("aptos"),
//           operationsCount: 0,
//           operations: [],
//           pendingOperations: [],
//           lastSyncDate: new Date(),
//           balanceHistoryCache: {},
//           swapHistory: [],
//         },
//       } as unknown as AccountShapeInfo<Account>,
//       {} as SyncConfig,
//     );

//     expect(account.xpub).toEqual("address");
//     expect(mockedFistValueFrom).toHaveBeenCalledTimes(0);
//     expect(mockedDecodeAccountId).toHaveBeenCalledTimes(1);
//     expect(mockedAptosAPI).toHaveBeenCalledTimes(1);
//     expect(mockGetAccountSpy).toHaveBeenCalledWith("address", undefined);
//   });

//   it("unable to get xpub error is thrown", async () => {
//     mockedDecodeAccountId = jest.mocked(decodeAccountId).mockReturnValue({
//       currencyId: "aptos",
//       derivationMode: "",
//       type: "js",
//       version: "1",
//       xpubOrAddress: "",
//     });

//     expect(
//       async () =>
//         await getAccountShape(
//           {
//             id: "1",
//             address: "address",
//             currency: getCryptoCurrencyById("aptos"),
//             derivationMode: "",
//             index: 0,
//             xpub: "address",
//             derivationPath: "",
//             // deviceId: "1",
//             initialAccount: {
//               id: "1:1:1:1:1",
//               // xpub: "address",
//               seedIdentifier: "1",
//               derivationMode: "",
//               index: 0,
//               freshAddress: "address",
//               freshAddressPath: "",
//               used: true,
//               balance: BigInt(10),
//               spendableBalance: BigInt(10),
//               creationDate: new Date(),
//               blockHeight: 0,
//               currency: getCryptoCurrencyById("aptos"),
//               operationsCount: 0,
//               operations: [],
//               pendingOperations: [],
//               lastSyncDate: new Date(),
//               balanceHistoryCache: {},
//               swapHistory: [],
//             },
//           } as unknown as AccountShapeInfo<Account>,
//           {} as SyncConfig,
//         ),
//     ).rejects.toThrow("Unable to retrieve public key");
//   });

//   it("unable to get xpub error is thrown when there is no initial account", async () => {
//     mockedDecodeAccountId = jest.mocked(decodeAccountId).mockReturnValue({
//       currencyId: "aptos",
//       derivationMode: "",
//       type: "js",
//       version: "1",
//       xpubOrAddress: "",
//     });

//     expect(
//       async () =>
//         await getAccountShape(
//           {
//             id: "1",
//             address: "address",
//             currency: getCryptoCurrencyById("aptos"),
//             derivationMode: "",
//             index: 0,
//             xpub: "address",
//             derivationPath: "",
//           } as unknown as AccountShapeInfo<Account>,
//           {} as SyncConfig,
//         ),
//     ).rejects.toThrow("Unable to retrieve public key");
//   });

//   it("get xpub from device id and account has operations history", async () => {
//     const mockGetAccountInfo = jest.fn().mockImplementation(async () => ({
//       balance: BigInt(0),
//       transactions: [],
//       blockHeight: 0,
//     }));
//     mockedAptosAPI.mockImplementation(() => ({
//       getAccountInfo: mockGetAccountInfo,
//     }));
//     const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

//     const account = await getAccountShape(
//       {
//         id: "1",
//         address: "address",
//         currency: getCryptoCurrencyById("aptos"),
//         derivationMode: "",
//         index: 0,
//         xpub: "address",
//         derivationPath: "",
//         deviceId: "1",
//         initialAccount: {
//           id: "1:1:1:1:1",
//           // xpub: "address",
//           seedIdentifier: "1",
//           derivationMode: "",
//           index: 0,
//           freshAddress: "address",
//           freshAddressPath: "",
//           used: true,
//           balance: BigInt(10),
//           spendableBalance: BigInt(10),
//           creationDate: new Date(),
//           blockHeight: 0,
//           currency: getCryptoCurrencyById("aptos"),
//           operationsCount: 1,
//           operations: [
//             {
//               id: "1",
//               hash: "hash",
//               type: "OUT",
//               value: BigInt(10),
//               fee: BigInt(0),
//               blockHeight: 0,
//               blockHash: "blockHash",
//               accountId: "1",
//               senders: ["sender"],
//               recipients: ["recipient"],
//               date: new Date(),
//               // extra: {},
//             },
//           ],
//           pendingOperations: [],
//           lastSyncDate: new Date(),
//           balanceHistoryCache: {},
//           swapHistory: [],
//         },
//       } as unknown as AccountShapeInfo<Account>,
//       {} as SyncConfig,
//     );

//     expect(account.xpub).toEqual("7075626c69634b6579");
//     expect(mockedFistValueFrom).toHaveBeenCalledTimes(1);
//     expect(mockedDecodeAccountId).toHaveBeenCalledTimes(0);
//     expect(mockedAptosAPI).toHaveBeenCalledTimes(1);
//     expect(mockGetAccountSpy).toHaveBeenCalledWith("address", undefined);
//   });

//   it("get xpub from device id and account has operations history with extra", async () => {
//     const mockGetAccountInfo = jest.fn().mockImplementation(async () => ({
//       balance: BigInt(0),
//       transactions: [],
//       blockHeight: 0,
//     }));
//     mockedAptosAPI.mockImplementation(() => ({
//       getAccountInfo: mockGetAccountInfo,
//     }));
//     const mockGetAccountSpy = jest.spyOn({ getAccount: mockGetAccountInfo }, "getAccount");

//     const account = await getAccountShape(
//       {
//         id: "1",
//         address: "address",
//         currency: getCryptoCurrencyById("aptos"),
//         derivationMode: "",
//         index: 0,
//         xpub: "address",
//         derivationPath: "",
//         deviceId: "1",
//         initialAccount: {
//           id: "1:1:1:1:1",
//           // xpub: "address",
//           seedIdentifier: "1",
//           derivationMode: "",
//           index: 0,
//           freshAddress: "address",
//           freshAddressPath: "",
//           used: true,
//           balance: BigInt(10),
//           spendableBalance: BigInt(10),
//           creationDate: new Date(),
//           blockHeight: 0,
//           currency: getCryptoCurrencyById("aptos"),
//           operationsCount: 1,
//           operations: [
//             {
//               id: "1",
//               hash: "hash",
//               type: "OUT",
//               value: BigInt(10),
//               fee: BigInt(0),
//               blockHeight: 0,
//               blockHash: "blockHash",
//               accountId: "1",
//               senders: ["sender"],
//               recipients: ["recipient"],
//               date: new Date(),
//               extra: { version: 1 },
//             },
//           ],
//           pendingOperations: [],
//           lastSyncDate: new Date(),
//           balanceHistoryCache: {},
//           swapHistory: [],
//         },
//       } as unknown as AccountShapeInfo<Account>,
//       {} as SyncConfig,
//     );

//     expect(account.xpub).toEqual("7075626c69634b6579");
//     expect(mockedFistValueFrom).toHaveBeenCalledTimes(1);
//     expect(mockedDecodeAccountId).toHaveBeenCalledTimes(0);
//     expect(mockedAptosAPI).toHaveBeenCalledTimes(1);
//     expect(mockGetAccountSpy).toHaveBeenCalledWith("address", 1);
//   });
// });
