import { faker } from "@faker-js/faker";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { createFixtureAccount, createFixtureTransaction } from "../../bridge/bridge.fixture";
import buildSignOperation, { getAddress } from "../../bridge/signOperation";
import { signTransaction } from "../../network";
import { AptosSigner } from "../../types";

const generateTransaction = jest.fn(() => "tx");

jest.mock("../../network/client", () => {
  return {
    AptosAPI: () => ({
      generateTransaction,
    }),
  };
});

jest.mock("../../logic/buildTransaction", () => {
  return () => ({
    sequence_number: 789,
  });
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
            transactionSequenceNumber: new BigNumber(789),
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
            transactionSequenceNumber: new BigNumber(789),
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

  it("should have sub operations if it has subaccount", async () => {
    mockedSignTransaction.mockReturnValue("signedTx");

    const date = new Date("2020-01-01");
    jest.useFakeTimers().setSystemTime(date);

    const id = faker.string.uuid();
    const account = createFixtureAccount({
      id,
      subAccounts: [
        {
          type: "TokenAccount",
          id: "subAccountId",
          parentId: id,
          token: {
            type: "TokenCurrency",
            id: "aptos/coin/dstapt_0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5::staked_coin::stakedaptos",
            contractAddress:
              "0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5::staked_coin::StakedAptos",
            parentCurrency: {
              type: "CryptoCurrency",
              id: "aptos",
              coinType: 637,
              name: "Aptos",
              managerAppName: "Aptos",
              ticker: "APT",
              scheme: "aptos",
              color: "#231F20",
              family: "aptos",
              units: [
                {
                  name: "APT",
                  code: "APT",
                  magnitude: 8,
                },
              ],
              explorerViews: [
                {
                  address: "https://explorer.aptoslabs.com/account/$address?network=mainnet",
                  tx: "https://explorer.aptoslabs.com/txn/$hash?network=mainnet",
                },
              ],
            },
            name: "dstAPT",
            tokenType: "coin",
            ticker: "dstAPT",
            disableCountervalue: false,
            delisted: false,
            units: [
              {
                name: "dstAPT",
                code: "dstAPT",
                magnitude: 8,
              },
            ],
          },
          balance: BigNumber(100),
          spendableBalance: BigNumber(100),
          creationDate: date,
          operationsCount: 0,
          operations: [],
          pendingOperations: [],
          balanceHistoryCache: emptyHistoryCache,
          swapHistory: [],
        },
      ] as TokenAccount[],
    });

    const transaction = createFixtureTransaction({
      amount: BigNumber(5),
      subAccountId: "subAccountId",
    });

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
            value: new BigNumber(30),
            fee: transaction.fees,
            extra: {},
            blockHash: null,
            blockHeight: null,
            senders: [account.freshAddress],
            recipients: [transaction.recipient],
            accountId: "js:2:aptos:0x000:",
            date,
            transactionSequenceNumber: new BigNumber(789),
            subOperations: [
              {
                accountId: "subAccountId",
                date: new Date("2020-01-01"),
                fee: BigNumber(30),
                id: "subAccountId--OUT",
                recipients: ["recipient"],
                senders: ["address"],
                type: "OUT",
                value: BigNumber(5),
              },
            ],
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
