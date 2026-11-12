import { Transaction } from "@mysten/sui/transactions";
import { fromBase64 } from "@mysten/sui/utils";
import type { SuiCoinConfig } from "../config";
import { HASHI_WITHDRAWAL } from "../test/fixtures";
import { makeSuiClientFromGraphQL } from "./graphql/sui-client-adapter";
import { createSuiGrpcClient } from "./grpc/client";
import { buildRawTransaction } from "./sdk";

jest.mock("./graphql/client", () => ({ createSuiGraphQLClient: jest.fn(() => ({})) }));
jest.mock("./graphql/sui-client-adapter", () => ({ makeSuiClientFromGraphQL: jest.fn() }));
jest.mock("./grpc/client", () => ({ createSuiGrpcClient: jest.fn() }));

const HBTC = "0xd30fb3f8914efdbeb7b8e85fae1d65dc584b44a1281f66737b92bb9f03a59d06::btc::BTC";
const LONG_ZERO_TYPE = `0x${"0".repeat(61)}abc::other::OTHER`;
const SERIALIZED = new Uint8Array([1, 2, 3]);

const configWith = (transport: "graphql" | "grpc") =>
  ({
    node: { graphqlUrl: "https://graphql.test", grpcUrl: "https://grpc.test" },
    status: { type: "active" },
    features: { transport },
  }) as unknown as SuiCoinConfig;

const owned = (objectId: string) => ({
  $kind: "Object",
  Object: { $kind: "ImmOrOwnedObject", ImmOrOwnedObject: { objectId } },
});

/** A transaction as it looks once built: object inputs resolved, withdrawals in place. */
const builtTransaction = (inputs: unknown[], gasPayment: string[] = []) => {
  const build = jest.fn().mockResolvedValue(SERIALIZED);
  const gasData = { payment: gasPayment.map(objectId => ({ objectId })) };
  return {
    tx: { build, getData: () => ({ inputs, gasData }) } as unknown as Transaction,
    build,
  };
};

const getObjects = jest.fn();
const client = { core: { getObjects, resolveTransactionPlugin: jest.fn() } };

beforeEach(() => {
  jest.clearAllMocks();
  (createSuiGrpcClient as jest.Mock).mockReturnValue(client);
  (makeSuiClientFromGraphQL as jest.Mock).mockReturnValue(client);
});

describe.each(["grpc", "graphql"] as const)("buildRawTransaction (%s)", transport => {
  const config = configWith(transport);

  it("builds through the transport client and returns the bytes and input objects", async () => {
    const { tx, build } = builtTransaction([]);

    const result = await buildRawTransaction(config, tx);

    expect(build).toHaveBeenCalledWith({ client: expect.anything() });
    expect(result).toEqual({ serialized: SERIALIZED, bcsObjects: [], coinTypes: [] });
    expect(getObjects).not.toHaveBeenCalled();
  });

  it("collects the distinct non-SUI coin types of owned coins and address-balance withdrawals", async () => {
    getObjects.mockResolvedValue({
      objects: [
        { type: `0x2::coin::Coin<${HBTC}>`, objectBcs: new Uint8Array([1]) },
        { type: `0x2::coin::Coin<${HBTC}>`, objectBcs: new Uint8Array([2]) },
        { type: "0x2::coin::Coin<0x2::sui::SUI>", objectBcs: new Uint8Array([3]) },
        { type: "0x2::kiosk::Kiosk", objectBcs: new Uint8Array([4]) },
        new Error("object not found"),
      ],
    });
    const { tx } = builtTransaction([
      owned("0x1"),
      owned("0x2"),
      owned("0x3"),
      owned("0x4"),
      owned("0x5"),
      { $kind: "Object", Object: { $kind: "SharedObject", SharedObject: { objectId: "0x6" } } },
      { $kind: "Pure", Pure: { bytes: "AA==" } },
      { $kind: "FundsWithdrawal", FundsWithdrawal: { typeArg: { Balance: LONG_ZERO_TYPE } } },
      { $kind: "FundsWithdrawal", FundsWithdrawal: { typeArg: { Balance: "0x2::sui::SUI" } } },
    ]);

    const { coinTypes, bcsObjects } = await buildRawTransaction(config, tx);

    expect(getObjects).toHaveBeenCalledTimes(1);
    expect(getObjects).toHaveBeenCalledWith({
      objectIds: ["0x1", "0x2", "0x3", "0x4", "0x5"],
      include: { objectBcs: true },
    });
    expect(coinTypes.sort()).toEqual([HBTC, "0xabc::other::OTHER"].sort());
    expect(bcsObjects).toEqual([1, 2, 3, 4].map(byte => new Uint8Array([byte])));
  });

  it("fetches gas payment objects first, in one call, and skips their SUI type", async () => {
    getObjects.mockResolvedValue({
      objects: [
        { type: "0x2::coin::Coin<0x2::sui::SUI>", objectBcs: new Uint8Array([9]) },
        { type: `0x2::coin::Coin<${HBTC}>`, objectBcs: new Uint8Array([8]) },
      ],
    });
    const { tx } = builtTransaction([owned("0x1")], ["0xgas"]);

    const result = await buildRawTransaction(config, tx);

    expect(getObjects).toHaveBeenCalledTimes(1);
    expect(getObjects).toHaveBeenCalledWith({
      objectIds: ["0xgas", "0x1"],
      include: { objectBcs: true },
    });
    expect(result.bcsObjects).toEqual([new Uint8Array([9]), new Uint8Array([8])]);
    expect(result.coinTypes).toEqual([HBTC]);
  });

  it("skips objects that are not coins or have no type", async () => {
    getObjects.mockResolvedValue({
      objects: [
        { type: "not a struct tag <<", objectBcs: new Uint8Array([7]) },
        { objectBcs: new Uint8Array([6]) },
      ],
    });
    const { tx } = builtTransaction([owned("0x1"), owned("0x2")]);

    const result = await buildRawTransaction(config, tx);

    expect(result.coinTypes).toEqual([]);
    expect(result.bcsObjects).toEqual([new Uint8Array([7]), new Uint8Array([6])]);
  });

  it("keeps a Hashi withdrawal as built and reads hBTC from its address-balance withdrawal", async () => {
    const bytes = fromBase64(HASHI_WITHDRAWAL.transactionBcs);

    const result = await buildRawTransaction(config, Transaction.from(bytes));

    expect(Array.from(result.serialized)).toEqual(Array.from(bytes));
    expect(result.coinTypes).toEqual([HBTC]);
    expect(result.bcsObjects).toEqual([]);
    expect(getObjects).not.toHaveBeenCalled();
  });

  it("propagates a build failure", async () => {
    const { tx, build } = builtTransaction([]);
    build.mockRejectedValue(new Error("dry run aborted"));

    await expect(buildRawTransaction(config, tx)).rejects.toThrow("dry run aborted");
  });
});
