import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import { createFixtureAccount, createFixtureTransaction } from "../../bridge/bridge.fixture";
import buildSignOperation, { getAddress } from "../../bridge/signOperation";
import { AptosSigner } from "../../types";
import { signTransaction } from "../../network";

jest.mock("../../api", () => {
  return {
    AptosAPI: function () {
      return {
        generateTransaction: jest.fn(() => "tx"),
      };
    },
  };
});

jest.mock("../../bridge/buildTransaction", () => {
  return function () {
    return {
      sequence_number: "789",
    };
  };
});

jest.mock("../../network");
let mockedSignTransaction: jest.Mocked<any>;

describe("getAddress", () => {
  it("should return address and derivationPath", () => {
    const account = createFixtureAccount();
    expect(getAddress(account)).toEqual({ address: "address", derivationPath: "derivation_path" });
  });
});

describe("buildSignOperation", () => {
  beforeEach(() => {
    mockedSignTransaction = jest.mocked(signTransaction);
  });
  afterEach(() => jest.clearAllMocks());

  it("should thrown an error", async () => {
    mockedSignTransaction.mockImplementation(() => {
      throw new Error("observable-catch-error");
    });

    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    account.id = "js:2:aptos:0x000:";
    transaction.mode = "send";

    const observable = await buildSignOperation({} as unknown as SignerContext<AptosSigner>)({
      account,
      deviceId: "1",
      transaction,
    });

    observable.subscribe({
      error: err => {
        expect(err.message).toBe("observable-catch-error");
      },
    });
  });

  it("should return 3 operations", async () => {
    mockedSignTransaction.mockReturnValue("signedTx");

    const date = new Date("2020-01-01");
    jest.useFakeTimers().setSystemTime(date);

    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    account.id = "js:2:aptos:0x000:";
    transaction.mode = "send";

    const observable = await buildSignOperation({} as unknown as SignerContext<AptosSigner>)({
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
            id: "js:2:aptos:0x000:--OUT",
            hash: "",
            type: "OUT",
            value: new BigNumber(0),
            fee: new BigNumber(0),
            extra: {},
            blockHash: null,
            blockHeight: null,
            senders: [account.freshAddress],
            recipients: [transaction.recipient],
            accountId: "js:2:aptos:0x000:",
            date,
            transactionSequenceNumber: 789,
            subOperations: [],
          },
          signature: "7369676e65645478",
        },
      },
    ];

    let i = 0;

    observable.forEach(signOperationEvent => {
      expect(signOperationEvent).toEqual(expectedValues[i]);
      i++;
    });
  });

  it("should return 3 operations with all amount", async () => {
    mockedSignTransaction.mockReturnValue("signedTx");

    const date = new Date("2020-01-01");
    jest.useFakeTimers().setSystemTime(date);

    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({ amount: BigNumber(5) });

    account.balance = new BigNumber(40);
    transaction.fees = new BigNumber(30);
    transaction.useAllAmount = true;

    account.id = "js:2:aptos:0x000:";
    transaction.mode = "send";

    const observable = await buildSignOperation({} as unknown as SignerContext<AptosSigner>)({
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
            id: "js:2:aptos:0x000:--OUT",
            hash: "",
            type: "OUT",
            value: new BigNumber(35),
            fee: transaction.fees,
            extra: {},
            blockHash: null,
            blockHeight: null,
            senders: [account.freshAddress],
            recipients: [transaction.recipient],
            accountId: "js:2:aptos:0x000:",
            date,
            transactionSequenceNumber: 789,
            subOperations: [],
          },
          signature: "7369676e65645478",
        },
      },
    ];

    let i = 0;

    observable.forEach(signOperationEvent => {
      expect(signOperationEvent).toEqual(expectedValues[i]);
      i++;
    });
  });
});
