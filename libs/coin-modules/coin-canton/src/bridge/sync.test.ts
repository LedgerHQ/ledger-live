import { makeGetAccountShape } from "./sync";
import { OperationInfo } from "../network/gateway";
import * as gateway from "../network/gateway";
import * as onboard from "./onboard";
import * as config from "../config";
import resolver from "../signer";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

jest.mock("../network/gateway");
jest.mock("../signer");
jest.mock("../config");
jest.mock("./onboard");

const mockedGetBalance = gateway.getBalance as jest.Mock;
const mockedGetLedgerEnd = gateway.getLedgerEnd as jest.Mock;
const mockedGetOperations = gateway.getOperations as jest.Mock;
const mockedResolver = resolver as jest.Mock;
const mockedIsOnboarded = onboard.isAccountOnboarded as jest.Mock;
const mockedIsAuthorized = onboard.isCantonCoinPreapproved as jest.Mock;
const mockedCoinConfig = config.default.getCoinConfig as jest.Mock;

const sampleCurrency = {
  id: "testcoin",
};

describe("makeGetAccountShape", () => {
  const fakeSignerContext = {} as any;

  const defaultInfo = {
    address: "addr1",
    currency: sampleCurrency,
    derivationMode: "",
    derivationPath: "44'/0'/0'/0/0",
    deviceId: "fakeDevice",
    initialAccount: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedResolver.mockReturnValue(async () => ({
      publicKey: "FAKE_PUBLIC_KEY",
    }));

    mockedIsOnboarded.mockResolvedValue({
      isOnboarded: true,
      partyId: "party123",
    });

    mockedCoinConfig.mockReturnValue({
      nativeInstrumentId: "Native",
      minReserve: "0",
      useGateway: true,
    });

    mockedIsAuthorized.mockResolvedValue(true);
    mockedGetLedgerEnd.mockResolvedValue(12345);
  });

  it("should return a valid account shape with correct balances and operations", async () => {
    mockedGetBalance.mockResolvedValue([
      {
        instrument_id: "Native",
        amount: "1000",
        locked: false,
        utxo_count: 1,
      },
    ]);
    mockedGetOperations.mockResolvedValue({
      operations: [
        {
          transaction_hash: "tx1",
          uid: "uid1",
          type: "Send",
          fee: { value: "5" },
          transfers: [
            {
              value: "100",
              details: {
                metadata: {
                  reason: "test transfer",
                },
              },
            },
          ],
          transaction_timestamp: new Date().toISOString(),
          senders: ["party123"],
          recipients: ["party456"],
          block: {
            height: 1,
            hash: "blockhash1",
          },
        } as OperationInfo,
      ],
    });
    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape = await getAccountShape(defaultInfo as AccountShapeInfo<Account>, {
      paginationConfig: {},
    });

    expect(shape).toHaveProperty("id");
    expect(shape.balance).toEqual(BigNumber(1000));
    expect(shape.operations?.length).toBe(1);
    expect((shape.operations as any)[0].type).toBe("OUT");
    expect((shape.operations as any)[0].value).toEqual(BigNumber(105)); // 100 + 5 fee
    expect(shape.spendableBalance).toEqual(BigNumber(1000));
    expect(shape.used).toBe(true);
  });

  it("should handle locked balances correctly", async () => {
    mockedGetBalance.mockResolvedValue([
      {
        instrument_id: "Native",
        amount: "1000",
        locked: true,
        utxo_count: 1,
      },
      {
        instrument_id: "Native",
        amount: "10",
        locked: false,
        utxo_count: 1,
      },
    ]);

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape = await getAccountShape(defaultInfo as AccountShapeInfo<Account>, {
      paginationConfig: {},
    });

    expect(shape).toBeDefined();
    expect(shape.balance).toEqual(BigNumber(1010));
    expect(shape.spendableBalance).toEqual(BigNumber(1010));
  });

  it("should handle empty balances correctly", async () => {
    mockedGetBalance.mockResolvedValue([]);

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape = await getAccountShape(defaultInfo as AccountShapeInfo<Account>, {
      paginationConfig: {},
    });

    expect(shape).toBeDefined();
    expect(shape.balance).toEqual(BigNumber(0));
    expect(shape.spendableBalance).toEqual(BigNumber(0));
  });

  it("should default to FEES operation type when transferValue is 0", async () => {
    mockedGetBalance.mockResolvedValue([
      {
        instrument_id: "Native",
        amount: "1000",
        locked: false,
        utxo_count: 1,
      },
    ]);
    mockedGetOperations.mockResolvedValue({
      operations: [
        {
          transaction_hash: "tx2",
          uid: "uid2",
          type: "Send",
          fee: { value: "3" },
          transfers: [
            {
              value: "0",
              details: {
                metadata: {
                  reason: "fee only",
                },
              },
            },
          ],
          transaction_timestamp: new Date().toISOString(),
          senders: ["party123"],
          recipients: ["party456"],
          block: {
            height: 2,
            hash: "blockhash2",
          },
        } as OperationInfo,
      ],
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape: any = await getAccountShape(defaultInfo as AccountShapeInfo<Account>, {
      paginationConfig: {},
    });
    expect(shape).toBeDefined();
    expect(shape.operations[0].type).toBe("FEES");
    // In this case, value should equal the fee
    expect(shape.operations[0].value).toEqual(BigNumber(3));
  });

  it("should set operation type to TRANSFER_PROPOSAL when operationType is transfer-proposal", async () => {
    mockedGetBalance.mockResolvedValue([
      {
        instrument_id: "Native",
        amount: "1000",
        locked: false,
        utxo_count: 1,
      },
    ]);
    mockedGetOperations.mockResolvedValue({
      operations: [
        {
          transaction_hash: "tx3",
          uid: "uid3",
          type: "Send",
          fee: { value: "5" },
          transfers: [
            {
              value: "200",
              details: {
                operationType: "transfer-proposal",
                metadata: {
                  reason: "transfer proposal",
                },
              },
            },
          ],
          transaction_timestamp: new Date().toISOString(),
          senders: ["party123"],
          recipients: ["party456"],
          block: {
            height: 3,
            hash: "blockhash3",
          },
        } as OperationInfo,
      ],
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape: any = await getAccountShape(defaultInfo as AccountShapeInfo<Account>, {
      paginationConfig: {},
    });
    expect(shape).toBeDefined();
    expect(shape.operations[0].type).toBe("TRANSFER_PROPOSAL");
    expect(shape.operations[0].value).toEqual(BigNumber(200)); // transfer value only, fees not added for TRANSFER_PROPOSAL
  });

  it("should set operation type to TRANSFER_REJECTED when operationType is transfer-rejected", async () => {
    mockedGetBalance.mockResolvedValue([
      {
        instrument_id: "Native",
        amount: "1000",
        locked: false,
        utxo_count: 1,
      },
    ]);
    mockedGetOperations.mockResolvedValue({
      operations: [
        {
          transaction_hash: "tx4",
          uid: "uid4",
          type: "Send",
          fee: { value: "2" },
          transfers: [
            {
              value: "150",
              details: {
                operationType: "transfer-rejected",
                metadata: {
                  reason: "transfer rejected",
                },
              },
            },
          ],
          transaction_timestamp: new Date().toISOString(),
          senders: ["party123"],
          recipients: ["party456"],
          block: {
            height: 4,
            hash: "blockhash4",
          },
        } as OperationInfo,
      ],
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape: any = await getAccountShape(defaultInfo as AccountShapeInfo<Account>, {
      paginationConfig: {},
    });
    expect(shape).toBeDefined();
    expect(shape.operations[0].type).toBe("TRANSFER_REJECTED");
    expect(shape.operations[0].value).toEqual(BigNumber(150)); // transfer value only, fees not added for TRANSFER_REJECTED
  });

  it("should set operation type to TRANSFER_WITHDRAWN when operationType is transfer-withdrawn", async () => {
    mockedGetBalance.mockResolvedValue([
      {
        instrument_id: "Native",
        amount: "1000",
        locked: false,
        utxo_count: 1,
      },
    ]);
    mockedGetOperations.mockResolvedValue({
      operations: [
        {
          transaction_hash: "tx5",
          uid: "uid5",
          type: "Send",
          fee: { value: "1" },
          transfers: [
            {
              value: "50",
              details: {
                operationType: "transfer-withdrawn",
                metadata: {
                  reason: "transfer withdrawn",
                },
              },
            },
          ],
          transaction_timestamp: new Date().toISOString(),
          senders: ["party123"],
          recipients: ["party456"],
          block: {
            height: 5,
            hash: "blockhash5",
          },
        } as OperationInfo,
      ],
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape: any = await getAccountShape(defaultInfo as AccountShapeInfo<Account>, {
      paginationConfig: {},
    });
    expect(shape).toBeDefined();
    expect(shape.operations[0].type).toBe("TRANSFER_WITHDRAWN");
    expect(shape.operations[0].value).toEqual(BigNumber(50)); // transfer value only, fees not added for TRANSFER_WITHDRAWN
  });
});
