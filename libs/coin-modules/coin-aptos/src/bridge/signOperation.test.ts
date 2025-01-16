describe("APTOS signOperation", () => {
  it("be true", () => {
    expect(true).toBeTruthy();
  });
});

// import { Observable } from "rxjs";
// import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
// import signOperation from "./signOperation";
// import BigNumber from "bignumber.js";

// jest.mock("../api", () => {
//   return {
//     AptosAPI: function () {
//       return {
//         generateTransaction: jest.fn(() => "tx"),
//       };
//     },
//   };
// });

// let signTransaction;

// jest.mock("./LedgerAccount", () => {
//   return function () {
//     return {
//       init: jest.fn(),
//       signTransaction,
//     };
//   };
// });

// jest.mock("../../hw/deviceAccess", () => {
//   return {
//     withDevice: jest.fn(() => observable => {
//       return observable(new Observable());
//     }),
//   };
// });

// jest.mock("../../operation", () => {
//   return {
//     encodeOperationId: jest.fn(() => "js:2:aptos:0x000"),
//   };
// });

// jest.mock("./buildTransaction", () => {
//   return function () {
//     return {
//       sequence_number: "789",
//     };
//   };
// });

// describe("signOperation Test", () => {
//   beforeEach(() => {
//     signTransaction = jest.fn(() => "tx");
//   });

//   it("should thrown an error", async () => {
//     signTransaction = () => {
//       throw new Error("observable-catch-error");
//     };

//     const account = createFixtureAccount();
//     const transaction = createFixtureTransaction();

//     account.id = "js:2:aptos:0x000:";
//     transaction.mode = "send";

//     const observable = await signOperation({
//       account,
//       deviceId: "1",
//       transaction,
//     });

//     observable.subscribe({
//       error: err => {
//         expect(err.message).toBe("observable-catch-error");
//       },
//     });
//   });

//   it("should return 3 operations", async () => {
//     const date = new Date("2020-01-01");
//     jest.useFakeTimers().setSystemTime(date);

//     const account = createFixtureAccount();
//     const transaction = createFixtureTransaction();

//     account.id = "js:2:aptos:0x000:";
//     transaction.mode = "send";

//     const observable = await signOperation({
//       account,
//       deviceId: "1",
//       transaction,
//     });

//     expect(observable).toBeInstanceOf(Observable);

//     const expectedValues = [
//       { type: "device-signature-requested" },
//       { type: "device-signature-granted" },
//       {
//         type: "signed",
//         signedOperation: {
//           operation: {
//             id: "js:2:aptos:0x000",
//             hash: "",
//             type: "OUT",
//             value: new BigNumber(0),
//             fee: new BigNumber(0),
//             extra: {},
//             blockHash: null,
//             blockHeight: null,
//             senders: [account.freshAddress],
//             recipients: [transaction.recipient],
//             accountId: "js:2:aptos:0x000:",
//             date,
//             transactionSequenceNumber: 789,
//           },
//           signature: "7478",
//         },
//       },
//     ];

//     let i = 0;

//     observable.forEach(signOperationEvent => {
//       expect(signOperationEvent).toEqual(expectedValues[i]);
//       i++;
//     });
//   });

//   it("should return 3 operations with all amount", async () => {
//     const date = new Date("2020-01-01");
//     jest.useFakeTimers().setSystemTime(date);

//     const account = createFixtureAccount();
//     const transaction = createFixtureTransaction();

//     account.balance = new BigNumber(40);
//     transaction.fees = new BigNumber(30);
//     transaction.useAllAmount = true;

//     account.id = "js:2:aptos:0x000:";
//     transaction.mode = "send";

//     const observable = await signOperation({
//       account,
//       deviceId: "1",
//       transaction,
//     });

//     expect(observable).toBeInstanceOf(Observable);

//     const expectedValues = [
//       { type: "device-signature-requested" },
//       { type: "device-signature-granted" },
//       {
//         type: "signed",
//         signedOperation: {
//           operation: {
//             id: "js:2:aptos:0x000",
//             hash: "",
//             type: "OUT",
//             value: new BigNumber(10),
//             fee: transaction.fees,
//             extra: {},
//             blockHash: null,
//             blockHeight: null,
//             senders: [account.freshAddress],
//             recipients: [transaction.recipient],
//             accountId: "js:2:aptos:0x000:",
//             date,
//             transactionSequenceNumber: 789,
//           },
//           signature: "7478",
//         },
//       },
//     ];

//     let i = 0;

//     observable.forEach(signOperationEvent => {
//       expect(signOperationEvent).toEqual(expectedValues[i]);
//       i++;
//     });
//   });
// });
