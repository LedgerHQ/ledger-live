import BigNumber from "bignumber.js";
import * as config from "../config";
import * as gateway from "../network/gateway";
import resolver from "../signer";
import {
  createMockCantonAccountShapeInfo,
  createMockFeesView,
  createMockInstrumentBalance,
  createMockOperationView,
  createMockTransferView,
} from "../test/fixtures";
import * as onboard from "./onboard";
import { makeGetAccountShape } from "./sync";

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

describe("makeGetAccountShape", () => {
  const fakeSignerContext = {} as any;
  const defaultInfo = createMockCantonAccountShapeInfo();

  beforeEach(() => {
    jest.clearAllMocks();

    mockedResolver.mockReturnValue(async () => ({
      publicKey: "FAKE_PUBLIC_KEY",
    }));

    mockedIsOnboarded.mockResolvedValue({
      isOnboarded: true,
      partyId: "test-party-id",
    });

    mockedCoinConfig.mockReturnValue({
      nativeInstrumentId: "Amulet",
      minReserve: "0",
      useGateway: true,
    });

    mockedIsAuthorized.mockResolvedValue(true);
    mockedGetLedgerEnd.mockResolvedValue(12345);
  });

  it("should return a valid account shape with correct balances and operations", async () => {
    mockedGetBalance.mockResolvedValue([createMockInstrumentBalance()]);
    mockedGetOperations.mockResolvedValue({
      operations: [createMockOperationView()],
    });
    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });

    expect(shape).toHaveProperty("id");
    expect(shape.balance).toEqual(BigNumber(1000));
    expect(shape.operations?.length).toBe(1);
    expect((shape.operations as any)[0].type).toBe("IN");
    expect((shape.operations as any)[0].value).toEqual(BigNumber(100));
    expect(shape.spendableBalance).toEqual(BigNumber(1000));
    expect(shape.used).toBe(true);
  });

  it("should handle locked balances correctly", async () => {
    mockedGetBalance.mockResolvedValue([
      createMockInstrumentBalance({
        amount: "1000",
        locked: true,
      }),
      createMockInstrumentBalance({
        amount: "10",
      }),
    ]);

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });

    expect(shape).toBeDefined();
    expect(shape.balance).toEqual(BigNumber(1010));
    expect(shape.spendableBalance).toEqual(BigNumber(1010));
  });

  it("should handle empty balances correctly", async () => {
    mockedGetBalance.mockResolvedValue([]);

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });

    expect(shape).toBeDefined();
    expect(shape.balance).toEqual(BigNumber(0));
    expect(shape.spendableBalance).toEqual(BigNumber(0));
  });

  it("should default to FEES operation type when transferValue is 0", async () => {
    mockedGetBalance.mockResolvedValue([createMockInstrumentBalance()]);
    mockedGetOperations.mockResolvedValue({
      operations: [
        createMockOperationView({
          fee: createMockFeesView({ value: "3" }),
          transfers: [
            createMockTransferView({
              value: "0",
              details: {
                metadata: {
                  reason: "fee only",
                },
              },
            }),
          ],
        }),
      ],
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape: any = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });
    expect(shape).toBeDefined();
    expect(shape.operations[0].type).toBe("FEES");
    // In this case, value should equal the fee
    expect(shape.operations[0].value).toEqual(BigNumber(3));
  });

  it("should set operation type to TRANSFER_PROPOSAL when operationType is transfer-proposal", async () => {
    mockedGetBalance.mockResolvedValue([createMockInstrumentBalance()]);
    mockedGetOperations.mockResolvedValue({
      operations: [
        createMockOperationView({
          transfers: [
            createMockTransferView({
              value: "200",
              details: {
                operationType: "transfer-proposal",
                metadata: {
                  reason: "transfer proposal",
                },
              },
            }),
          ],
        }),
      ],
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape: any = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });
    expect(shape).toBeDefined();
    expect(shape.operations[0].type).toBe("TRANSFER_PROPOSAL");
    expect(shape.operations[0].value).toEqual(BigNumber(200)); // transfer value only, fees not added for TRANSFER_PROPOSAL
  });

  it("should set operation type to TRANSFER_REJECTED when operationType is transfer-rejected", async () => {
    mockedGetBalance.mockResolvedValue([createMockInstrumentBalance()]);
    mockedGetOperations.mockResolvedValue({
      operations: [
        createMockOperationView({
          transfers: [
            createMockTransferView({
              value: "150",
              details: {
                operationType: "transfer-rejected",
                metadata: {
                  reason: "transfer rejected",
                },
              },
            }),
          ],
        }),
      ],
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape: any = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });
    expect(shape).toBeDefined();
    expect(shape.operations[0].type).toBe("TRANSFER_REJECTED");
    expect(shape.operations[0].value).toEqual(BigNumber(150)); // transfer value only, fees not added for TRANSFER_REJECTED
  });

  it("should set operation type to TRANSFER_WITHDRAWN when operationType is transfer-withdrawn", async () => {
    mockedGetBalance.mockResolvedValue([createMockInstrumentBalance()]);
    mockedGetOperations.mockResolvedValue({
      operations: [
        createMockOperationView({
          transfers: [
            createMockTransferView({
              value: "50",
              details: {
                operationType: "transfer-withdrawn",
                metadata: {
                  reason: "transfer withdrawn",
                },
              },
            }),
          ],
        }),
      ],
    });

    const getAccountShape = makeGetAccountShape(fakeSignerContext);
    const shape: any = await getAccountShape(defaultInfo, {
      paginationConfig: {},
    });
    expect(shape).toBeDefined();
    expect(shape.operations[0].type).toBe("TRANSFER_WITHDRAWN");
    expect(shape.operations[0].value).toEqual(BigNumber(50)); // transfer value only, fees not added for TRANSFER_WITHDRAWN
  });
});
