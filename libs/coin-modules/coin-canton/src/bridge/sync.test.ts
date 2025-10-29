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
        instrument_id: "LockedNative",
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
});
