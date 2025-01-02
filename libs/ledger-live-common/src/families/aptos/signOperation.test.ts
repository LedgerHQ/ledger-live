import { Observable } from "rxjs";
import { createFixtureAccount } from "../../mock/fixtures/cryptoCurrencies";
import createTransaction from "./createTransaction";
import signOperation from "./signOperation";
import BigNumber from "bignumber.js";

jest.mock("./api", () => {
  return {
    AptosAPI: function () {
      return {
        generateTransaction: jest.fn(() => "tx"),
      };
    },
  };
});

jest.mock("./LedgerAccount", () => {
  return function () {
    return {
      init: jest.fn(),
      signTransaction: jest.fn(() => "tx"),
    };
  };
});

jest.mock("../../hw/deviceAccess", () => {
  return {
    withDevice: jest.fn(() => observable => {
      return observable(new Observable());
    }),
  };
});

jest.mock("../../operation", () => {
  return {
    encodeOperationId: jest.fn(() => "js:2:aptos:0x000"),
  };
});

jest.mock("./buildTransaction", () => {
  return function () {
    return jest.fn(() => {});
  };
});

describe("signOperation Test", () => {
  it("should return errors for AmountRequired", async () => {
    const account = createFixtureAccount();
    const transaction = createTransaction();

    const observable = await signOperation({
      account,
      deviceId: "1",
      transaction,
    });

    expect(observable).toBeInstanceOf(Observable);

    const expectedValues = [
      { type: "device-signature-requested" },
      { type: "device-signature-granted" },
      {
        type: "signed",
        signedOperation: {
          operation: {
            id: "js:2:aptos:0x000",
            hash: "",
            type: "OUT",
            value: new BigNumber(0),
            fee: new BigNumber(0),
            extra: {},
            blockHash: null,
            blockHeight: null,
            senders: [Array],
            recipients: [Array],
            accountId: "js:2:ethereum:0x000:",
            date: new Date(),
            transactionSequenceNumber: NaN,
          },
          signature: "7478",
        },
      },
    ];

    let i = 0;

    observable.forEach(signOperationEvent => {
      console.error("signOperationEvent", signOperationEvent);
      expect(signOperationEvent).toEqual(expectedValues[i]);
      i++;
    });
  });
});
