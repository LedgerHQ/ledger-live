import assert from "assert";
import { NotEnoughBalanceFees } from "@ledgerhq/ledger-wallet-framework/errors";
import type { ClientWithCoreApi } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { BigNumber } from "bignumber.js";
import coinConfig from "../config";
import type { SuiCoinConfig } from "../config";
import { mist, ONE_SUI } from "../constants";
import * as sdk from "./sdk";
import { graphqlTxToSuiTransaction, type GraphQLTransactionNode } from "./graphql/transactions";
import type {
  SuiAccumulatorEvent,
  SuiBalanceChange,
  SuiInput,
  SuiTransactionKind,
  SuiTransactionResponse,
} from "./types";

const config: SuiCoinConfig = {
  status: { type: "active" },
  node: { graphqlUrl: "https://mockapi.sui.io/graphql", grpcUrl: "https://mockapi.sui.io" },
  features: { transport: "grpc" },
  name: "Sui",
  unit: { name: "Sui", code: "SUI", magnitude: 9 },
};

type MockCoin = { coinObjectId: string; balance: string; digest: string; version: string };
type MockCoinsPage = { data: MockCoin[]; hasNextPage: boolean; nextCursor?: string | null };
type MockBalance = { coinType: string; totalBalance: string; fundsInAddressBalance?: string };

const mockGetAllBalances = jest.fn<Promise<MockBalance[]>, [string]>();
const mockGetCoins = jest.fn<Promise<MockCoinsPage>, [unknown]>();
const mockSimulate = jest.fn();
const mockExecute = jest.fn();
const mockStakingEvents = jest.fn();
const mockListHistory = jest.fn();
const mockListTransactions = jest.fn();

const mockGrpcClient = {
  core: {
    getObjects: jest.fn().mockResolvedValue({ objects: [] }),
    getBalance: jest.fn().mockImplementation(async ({ owner, coinType }) => {
      const balances = await mockGetAllBalances(owner);
      const match = balances.find(b => b.coinType === coinType);
      const total = match?.totalBalance ?? "0";
      const addr = match?.fundsInAddressBalance ?? "0";
      // Mirror the real client: `coinBalance = total − addressBalance` (SIP-58).
      const coinBalance = String(BigInt(total) - BigInt(addr));
      return { balance: { coinType, balance: total, coinBalance, addressBalance: addr } };
    }),
    listCoins: jest.fn().mockImplementation(async ({ owner, coinType, cursor }) => {
      const r = await mockGetCoins({ owner, coinType, cursor });
      return {
        objects: r.data.map(c => ({
          objectId: c.coinObjectId,
          version: c.version,
          digest: c.digest,
          owner: { $kind: "AddressOwner", AddressOwner: owner },
          type: coinType,
          balance: c.balance,
        })),
        hasNextPage: r.hasNextPage,
        cursor: r.nextCursor ?? null,
      };
    }),
  },
};

jest.mock("./sdk.grpc", () => ({
  ...jest.requireActual("./sdk.grpc"),
  withGrpcApi: (_config: unknown, execute: (api: unknown) => unknown) => execute(mockGrpcClient),
  withoutBuildSimulation: (client: unknown) => client,
  getAllBalancesGrpc: (_api: unknown, owner: string) => mockGetAllBalances(owner),
  simulateTransactionGrpc: (...args: unknown[]) => mockSimulate(...args),
  executeTransactionGrpc: (...args: unknown[]) => mockExecute(...args),
  getStakingEventsByDigestGrpc: (...args: unknown[]) => mockStakingEvents(...args),
  listHistoryByAddressGrpc: (...args: unknown[]) => mockListHistory(...args),
  listTransactionsByAddressGrpc: (...args: unknown[]) => mockListTransactions(...args),
  fetchCheckpointDigestsGrpc: async () => new Map(),
  resolveCheckpointForDigestGrpc: async () => null,
}));

jest.mock("@mysten/sui/transactions", () => {
  const mockTxb = { transactionBlock: new Uint8Array() };

  return {
    ...jest.requireActual("@mysten/sui/transactions"),
    Transaction: jest.fn().mockImplementation(() => {
      return {
        gas: "0xmock_gas_object_id",
        setSender: jest.fn(),
        setGasPayment: jest.fn(),
        splitCoins: jest.fn().mockReturnValue(["0xmock_coin"]),
        transferObjects: jest.fn(),
        moveCall: jest.fn(),
        object: jest.fn(),
        add: jest.fn().mockReturnValue("0xmock_intent_coin"),
        addIntentResolver: jest.fn(),
        pure: {
          address: jest.fn(),
          u64: jest.fn(),
        },
        build: jest.fn().mockResolvedValue(mockTxb),
        setGasBudgetIfNotSet: jest.fn(),
        getData: jest.fn().mockImplementation(() => ({ gasData: {}, inputs: [] })),
      };
    }),
  };
});

const coreClient = mockGrpcClient as unknown as ClientWithCoreApi;

const makeTx = (overrides: Partial<SuiTransactionResponse> = {}): SuiTransactionResponse => ({
  digest: "digest",
  transaction: {
    data: {
      sender: "0xsender",
      gasData: { owner: "0xsender" },
      transaction: { kind: "ProgrammableTransaction", inputs: [], transactions: [] },
    },
  },
  effects: {
    status: { status: "success" },
    gasUsed: { computationCost: "0", storageCost: "0", storageRebate: "0" },
    accumulatorEvents: [],
  },
  events: [],
  balanceChanges: [],
  timestampMs: "1742294454878",
  checkpoint: "313024",
  ...overrides,
});

const withAccumulatorEvents = (
  tx: SuiTransactionResponse,
  accumulatorEvents: SuiAccumulatorEvent[],
): SuiTransactionResponse => ({ ...tx, effects: { ...tx.effects, accumulatorEvents } });

const withGasOwner = (
  tx: SuiTransactionResponse,
  owner: string | undefined,
): SuiTransactionResponse => ({
  ...tx,
  transaction: { data: { ...tx.transaction.data, gasData: { owner } } },
});

const SENDER = "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24";
const RECIPIENT = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";
const VALIDATOR = "0x3d9fb148e35ef4d74fcfc36995da14fc504b885d5f2bfeca37d6ea2cc044a32d";

const mockTransaction: SuiTransactionResponse = makeTx({
  digest: "DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt",
  transaction: {
    data: {
      transaction: {
        kind: "ProgrammableTransaction",
        inputs: [{ type: "pure", valueType: "address", value: RECIPIENT }],
        transactions: [{ Other: "TransferObjects" }],
      },
      sender: SENDER,
      gasData: { owner: SENDER },
    },
  },
  effects: {
    status: { status: "success" },
    gasUsed: { computationCost: "1000000", storageCost: "988000", storageRebate: "978120" },
    accumulatorEvents: [],
  },
  balanceChanges: [
    { address: SENDER, coinType: "0x2::sui::SUI", amount: mist(-10) },
    { address: RECIPIENT, coinType: "0x2::sui::SUI", amount: "9998990120" },
    { address: RECIPIENT, coinType: "0x123::test::TOKEN", amount: "500000" },
  ],
  timestampMs: "1742294454878",
  checkpoint: "313024",
});

const stakingCall = (fn: string): SuiTransactionKind => ({
  kind: "ProgrammableTransaction",
  inputs: [],
  transactions: [{ MoveCall: { package: "0x3", module: "sui_system", function: fn } }],
});

const STAKING_GAS = { computationCost: "1000000", storageCost: "500000", storageRebate: "450000" };

// amount must be a negative number
function mockStakingTx(address: string, amount: string): SuiTransactionResponse {
  assert(new BigNumber(amount).lte(0), "amount must be a negative number");
  return makeTx({
    digest: "delegate_tx_digest_123",
    transaction: {
      data: {
        sender: address,
        gasData: { owner: address },
        transaction: stakingCall("request_add_stake"),
      },
    },
    effects: { status: { status: "success" }, gasUsed: STAKING_GAS, accumulatorEvents: [] },
    balanceChanges: [
      {
        address,
        coinType: "0x2::sui::SUI",
        amount: amount.startsWith("-") ? amount : `-${amount}`,
      },
    ],
    events: [
      {
        type: "0x3::validator::StakingRequestEvent",
        parsedJson: {
          validator_address: VALIDATOR,
          staked_sui_id: "0xstaked_object_id_123",
          // `StakingRequestEvent` carries the staked principal as `amount`
          // (Sui `sui_system::validator`); `UnstakingRequestEvent` uses `principal_amount`.
          amount: String(ONE_SUI),
        },
      },
    ],
  });
}

// amount must be a positive number
function mockUnstakingTx(address: string, amount: string): SuiTransactionResponse {
  return makeTx({
    digest: "undelegate_tx_digest_456",
    transaction: {
      data: {
        sender: address,
        gasData: { owner: address },
        transaction: stakingCall("request_withdraw_stake"),
      },
    },
    effects: { status: { status: "success" }, gasUsed: STAKING_GAS, accumulatorEvents: [] },
    balanceChanges: [{ address, coinType: "0x2::sui::SUI", amount }],
    events: [
      {
        type: "0x3::validator::UnstakingRequestEvent",
        parsedJson: {
          validator_address: VALIDATOR,
          principal_amount: mist(1.2),
          reward_amount: mist(0.05),
        },
      },
    ],
  });
}

const createMockCoins = (balances: string[]): MockCoin[] =>
  balances.map((balance, index) => ({
    coinObjectId: `0xcoin${index + 1}`,
    balance,
    digest: `0xdigest${index + 1}`,
    version: "1",
  }));

beforeAll(() => {
  coinConfig.setCoinConfig(() => config);
});

const defaultGetCoinsResponse: MockCoinsPage = {
  data: [
    { coinObjectId: "0xtest_coin_object_id", balance: mist(1), digest: "0xdigest", version: "1" },
  ],
  hasNextPage: false,
};

const defaultGetAllBalancesResponse: MockBalance[] = [
  { coinType: "0x2::sui::SUI", totalBalance: mist(1), fundsInAddressBalance: mist(0.4) },
  { coinType: "0x123::test::TOKEN", totalBalance: "500000" },
];

beforeEach(() => {
  mockGetCoins.mockReset();
  mockGetCoins.mockResolvedValue(defaultGetCoinsResponse);
  mockGetAllBalances.mockReset();
  mockGetAllBalances.mockResolvedValue(defaultGetAllBalancesResponse);
  mockSimulate.mockReset();
  mockSimulate.mockResolvedValue({
    gasBudget: "4000000",
    computationCost: "1000000",
    storageCost: "500000",
    storageRebate: "450000",
  });
  mockExecute.mockReset();
  mockExecute.mockResolvedValue({ digest: "transaction_digest_123", status: "success" });
  mockListHistory.mockReset();
  mockListHistory.mockResolvedValue([]);
  mockListTransactions.mockReset();
});

const sendTransaction = (overrides: Partial<{ coinType: string; amount: BigNumber }> = {}) => ({
  mode: "send" as const,
  coinType: sdk.DEFAULT_COIN_TYPE,
  family: "sui" as const,
  amount: new BigNumber(100),
  recipient: "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164",
  errors: {},
  ...overrides,
});

const lastTransactionInstance = () =>
  (Transaction as unknown as jest.Mock).mock.results.at(-1)!.value;

describe("SDK Functions", () => {
  test("getAccountBalances should return array of account balances", async () => {
    const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
    const balances = await sdk.getAccountBalances(config, address);

    expect(Array.isArray(balances)).toBe(true);
    expect(balances.length).toBeGreaterThan(0);

    const firstBalance = balances[0];
    expect(firstBalance).toHaveProperty("coinType");
    expect(firstBalance).toHaveProperty("blockHeight");
    expect(firstBalance).toHaveProperty("balance");
    expect(firstBalance).toHaveProperty("fundsInAddressBalance");
    expect(firstBalance.balance).toBeInstanceOf(BigNumber);

    const coinTypes = balances.map(b => b.coinType);
    expect(coinTypes).toContain(sdk.DEFAULT_COIN_TYPE);
  });

  test("getAccountBalances surfaces SIP-58 fundsInAddressBalance when present", async () => {
    const address = "0x44444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
    const balances = await sdk.getAccountBalances(config, address);

    const sui = balances.find(b => b.coinType === sdk.DEFAULT_COIN_TYPE)!;
    expect(sui.balance).toEqual(BigNumber(mist(1)));
    expect(sui.fundsInAddressBalance).toEqual(BigNumber(mist(0.4)));

    const token = balances.find(b => b.coinType === "0x123::test::TOKEN")!;
    expect(token.balance).toEqual(BigNumber("500000"));
    expect(token.fundsInAddressBalance).toEqual(BigNumber("0"));
  });

  test("getOperationType should return IN for incoming tx", () => {
    const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
    expect(sdk.getOperationType(address, mockTransaction)).toBe("IN");
  });

  test("getOperationType should return OUT for outgoing tx", () => {
    expect(sdk.getOperationType(SENDER, mockTransaction)).toBe("OUT");
  });

  test("getOperationSenders should return sender address", () => {
    expect(sdk.getOperationSenders(mockTransaction.transaction.data)).toEqual([SENDER]);
  });

  test("getOperationRecipients should return recipient addresses", () => {
    expect(sdk.getOperationRecipients(mockTransaction.transaction.data)).toEqual([RECIPIENT]);
  });

  test("getOperationFee should calculate fee correctly", () => {
    expect(sdk.getOperationFee(mockTransaction)).toEqual(new BigNumber(1009880));
  });

  test("getOperationDate should return correct date", () => {
    const date = sdk.getOperationDate(mockTransaction);
    expect(date).toBeInstanceOf(Date);
  });

  test("getOperationCoinType should extract token coin type", () => {
    const tokenTx = makeTx({
      ...mockTransaction,
      balanceChanges: [
        { address: RECIPIENT, coinType: "0x123::test::TOKEN", amount: "500000" },
        { address: RECIPIENT, coinType: sdk.DEFAULT_COIN_TYPE, amount: "-1009880" },
      ],
    });
    expect(sdk.getOperationCoinType(tokenTx)).toBe("0x123::test::TOKEN");

    const suiTx = makeTx({
      ...mockTransaction,
      balanceChanges: [
        { address: RECIPIENT, coinType: sdk.DEFAULT_COIN_TYPE, amount: "9998990120" },
      ],
    });
    expect(sdk.getOperationCoinType(suiTx)).toBe(sdk.DEFAULT_COIN_TYPE);
  });

  test("getOperationCoinType returns DEFAULT_COIN_TYPE for a GraphQL (long-form) SUI tx", () => {
    const graphqlTx = graphqlTxToSuiTransaction({
      digest: "0xtx",
      transactionJson: { sender: "0xowner" },
      effects: {
        status: "SUCCESS",
        balanceChangesJson: [
          {
            address: "0xowner",
            coinType:
              "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
            amount: "-1009880",
          },
        ],
      },
    } as unknown as GraphQLTransactionNode);

    expect(graphqlTx.balanceChanges[0]).toMatchObject({ coinType: "0x2::sui::SUI" });
    expect(sdk.getOperationCoinType(graphqlTx)).toBe(sdk.DEFAULT_COIN_TYPE);
  });

  test("transactionToOperation maps a GraphQL (gRPC-proto) staking tx to a DELEGATE op", () => {
    const sender = "0xf58d8d4ba6a2160f630c600a1b946cff4dac25c3fcac241e91bbd12791cd7528";
    const validator = "0x4fffd0005522be4bc029724c7f0f6ed7093a6bf3a09b90e62f61dc15181e1a3e";
    const graphqlTx = graphqlTxToSuiTransaction({
      digest: "FTow2FZLfLEwd4gGy4PUmBGkMD6gK27gge374H2rbRtS",
      transactionJson: {
        kind: {
          kind: "PROGRAMMABLE_TRANSACTION",
          programmableTransaction: {
            inputs: [
              { kind: "PURE", pure: "gO9pf1EAAAA=" }, // u64 350030000000
              {
                kind: "SHARED",
                objectId: "0x0000000000000000000000000000000000000000000000000000000000000005",
                version: "1",
                mutable: true,
                mutability: "MUTABLE",
              },
              { kind: "PURE", pure: "T//QAFUivkvAKXJMfw9u1wk6a/Ogm5DmL2HcFRgeGj4=" }, // validator address
            ],
            commands: [
              { splitCoins: { coin: { kind: "GAS" }, amounts: [{ kind: "INPUT", input: 0 }] } },
              {
                moveCall: {
                  package: "0x0000000000000000000000000000000000000000000000000000000000000003",
                  module: "sui_system",
                  function: "request_add_stake",
                  arguments: [
                    { kind: "INPUT", input: 1 },
                    { kind: "RESULT", result: 0 },
                    { kind: "INPUT", input: 2 },
                  ],
                },
              },
            ],
          },
        },
        sender,
        gasPayment: { objects: [], owner: sender, price: "100", budget: "11815536" },
      },
      effects: {
        status: "SUCCESS",
        timestamp: "2026-06-10T12:00:00.000Z",
        balanceChangesJson: [
          {
            address: sender,
            coinType:
              "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
            amount: "-350039759296",
          },
        ],
        gasEffects: {
          gasSummary: {
            computationCost: 100000,
            storageCost: 935833600,
            storageRebate: 926174304,
            nonRefundableStorageFee: 9355296,
          },
        },
      },
    } as unknown as GraphQLTransactionNode);

    const operation = sdk.transactionToOperation("mockAccountId", sender, graphqlTx);
    expect(operation.type).toBe("DELEGATE");
    expect(operation.value.toString()).toBe("350039759296");
    expect(operation.fee.toString()).toBe("9759296");
    expect(operation.senders).toEqual([sender]);
    // getOperationRecipients pushes every pure address input, then the isStaking branch pushes
    // the validator again.
    expect(operation.recipients).toEqual([validator, validator]);
    expect((operation.extra as { coinType: string }).coinType).toBe(sdk.DEFAULT_COIN_TYPE);
    expect(sdk.getFeesPayer(graphqlTx)).toBe(sender);
  });

  test("transactionToOperation should map transaction to operation", () => {
    const accountId = "mockAccountId";
    const suiTx = makeTx({
      ...mockTransaction,
      balanceChanges: [
        { address: SENDER, coinType: sdk.DEFAULT_COIN_TYPE, amount: mist(-10) },
        { address: RECIPIENT, coinType: sdk.DEFAULT_COIN_TYPE, amount: "9998990120" },
      ],
    });

    const operation = sdk.transactionToOperation(accountId, RECIPIENT, suiTx);
    expect(operation).toHaveProperty("id");
    expect(operation).toHaveProperty("accountId", accountId);
    expect(operation).toHaveProperty("extra");
    expect((operation.extra as { coinType: string }).coinType).toBe(sdk.DEFAULT_COIN_TYPE);

    const expectedAmount = sdk.getOperationAmount(RECIPIENT, suiTx, sdk.DEFAULT_COIN_TYPE);
    expect(expectedAmount.toString()).toBe("9998990120");
  });

  const tokenTransferTx = makeTx({
    ...mockTransaction,
    balanceChanges: [
      { address: SENDER, coinType: "0x123::test::TOKEN", amount: "-500000" },
      { address: RECIPIENT, coinType: "0x123::test::TOKEN", amount: "500000" },
      { address: RECIPIENT, coinType: sdk.DEFAULT_COIN_TYPE, amount: "-1000000" },
    ],
  });

  test("transactionToOperation should map token transaction to operation", () => {
    const accountId = "mockAccountId";
    const operation = sdk.transactionToOperation(accountId, RECIPIENT, tokenTransferTx);
    expect(operation).toHaveProperty("id");
    expect(operation).toHaveProperty("accountId", accountId);
    expect(operation).toHaveProperty("extra");
    expect((operation.extra as { coinType: string }).coinType).toBe("0x123::test::TOKEN");
    expect(operation.value).toEqual(new BigNumber("500000"));
  });

  test("transactionToOperation resolves amount when account address omits 0x or casing differs", () => {
    const addressNoPrefix = RECIPIENT.slice(2);
    const suiTx = makeTx({
      ...mockTransaction,
      balanceChanges: [
        { address: SENDER, coinType: sdk.DEFAULT_COIN_TYPE, amount: mist(-10) },
        {
          address: "0x6E143FE0A8CA010A86580DAFAC44298E5B1B7D73EFC345356A59A15F0D7824F0",
          coinType: sdk.DEFAULT_COIN_TYPE,
          amount: "9998990120",
        },
      ],
    });

    const op = sdk.transactionToOperation("mockAccountId", addressNoPrefix, suiTx);
    expect(op.value.toString()).toBe("9998990120");
  });

  test("transactionToOp should map token transaction to operation", () => {
    const operation = sdk.transactionToCoinFrameworkOperation(
      RECIPIENT,
      tokenTransferTx,
      "mockCheckpointHash",
    );
    expect(operation.id).toEqual("DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt");
    expect(operation.type).toEqual("IN");
    expect(operation.senders).toEqual([SENDER]);
    expect(operation.recipients).toEqual([RECIPIENT]);
    expect(operation.value).toEqual(500000n);
    expect(operation.asset).toEqual({ type: "token", assetReference: "0x123::test::TOKEN" });
    expect(operation.memo).toBeUndefined();
    expect(operation.details).toBeUndefined();
    expect(operation.tx.block.hash).toBe("mockCheckpointHash");
    expect(operation.tx).toMatchObject({
      hash: "DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt",
      block: { hash: "mockCheckpointHash" },
      fees: 1009880n,
      feesPayer: SENDER,
      date: new Date("2025-03-18T10:40:54.878Z"),
    });
  });

  test("getOperations should fetch operations", async () => {
    const addr = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
    const operations = await sdk.getOperations(config, "mockAccountId", addr);
    expect(operations).toEqual([]);
  });

  test("paymentInfo should return gas budget and fees", async () => {
    const info = await sdk.paymentInfo(config, RECIPIENT, sendTransaction());
    expect(info).toEqual({ gasBudget: "4000000", totalGasUsed: 1050000n, fees: 1050000n });
  });

  test("paymentInfo should throw NotEnoughBalanceFees when the simulation fails with needed amount message", async () => {
    mockSimulate.mockRejectedValueOnce(
      new Error("Balance of gas object 10 is lower than the needed amount: 100"),
    );
    await expect(sdk.paymentInfo(config, RECIPIENT, sendTransaction())).rejects.toThrow(
      NotEnoughBalanceFees,
    );
  });

  test("paymentInfo should rethrow unrecognised errors from the simulation", async () => {
    mockSimulate.mockRejectedValueOnce(new Error("Network timeout"));
    await expect(sdk.paymentInfo(config, RECIPIENT, sendTransaction())).rejects.toThrow(
      "Network timeout",
    );
  });

  test("createTransaction should build a transaction", async () => {
    const tx = await sdk.createTransaction(config, RECIPIENT, sendTransaction());
    expect(tx).toEqual({ unsigned: { transactionBlock: expect.any(Uint8Array) } });
  });

  test("createTransaction sets empty gas payment when sender's funds are in address balance", async () => {
    mockGetAllBalances.mockResolvedValueOnce([
      { coinType: sdk.DEFAULT_COIN_TYPE, totalBalance: mist(1), fundsInAddressBalance: mist(1) },
    ]);

    const tx = await sdk.createTransaction(config, RECIPIENT, sendTransaction());
    expect(tx).toEqual({ unsigned: { transactionBlock: expect.any(Uint8Array) } });
    expect(mockGetAllBalances).toHaveBeenCalledWith(RECIPIENT);
    expect(lastTransactionInstance().setGasPayment).toHaveBeenCalledWith([]);
  });

  test("createTransaction does not force empty gas payment when real coins exist alongside an address balance", async () => {
    // SIP-58 regression guard: with BOTH real coin objects and an address balance, gas must be
    // paid from the real coins (SDK auto-selection) so the full address balance stays available
    // for the transfer. Forcing setGasPayment([]) here is what overdrew the address balance at
    // broadcast ("Invalid withdraw reservation": amount + gasBudget > addressBalance).
    mockGetAllBalances.mockResolvedValueOnce([
      { coinType: sdk.DEFAULT_COIN_TYPE, totalBalance: mist(10), fundsInAddressBalance: mist(8) },
    ]);

    // Amount == address balance: the window that previously overdrew it.
    const transaction = sendTransaction({ amount: new BigNumber(mist(8)) });
    const tx = await sdk.createTransaction(config, RECIPIENT, transaction);
    expect(tx).toEqual({ unsigned: { transactionBlock: expect.any(Uint8Array) } });
    expect(lastTransactionInstance().setGasPayment).not.toHaveBeenCalled();
  });

  test("createTransaction uses coinWithBalance fallback for token with no coin objects", async () => {
    mockGetCoins.mockResolvedValue({ data: [], hasNextPage: false });

    const transaction = sendTransaction({
      coinType: "0x123::test::TOKEN",
      amount: new BigNumber(1000),
    });
    const tx = await sdk.createTransaction(config, RECIPIENT, transaction);
    expect(tx).toEqual({ unsigned: { transactionBlock: expect.any(Uint8Array) } });
  });

  test("createTransaction uses coinWithBalance fallback when coins insufficient", async () => {
    mockGetCoins.mockResolvedValue({ data: createMockCoins(["100"]), hasNextPage: false });

    const transaction = sendTransaction({
      coinType: "0x123::test::TOKEN",
      amount: new BigNumber(5000),
    });
    const tx = await sdk.createTransaction(config, RECIPIENT, transaction);
    expect(tx).toEqual({ unsigned: { transactionBlock: expect.any(Uint8Array) } });
  });

  test("executeTransactionBlock should execute a transaction", async () => {
    const result = await sdk.executeTransactionBlock(config, {
      transactionBlock: new Uint8Array(),
      signature: "mockSignature",
    });

    expect(result).toEqual({
      digest: "transaction_digest_123",
      effects: { status: { status: "success" } },
    });
    expect(mockExecute).toHaveBeenCalledWith(mockGrpcClient, new Uint8Array(), ["mockSignature"]);
  });

  test("executeTransactionBlock flags a response without a status as a failure", async () => {
    mockExecute.mockResolvedValueOnce({ digest: "transaction_digest_123" });

    const result = await sdk.executeTransactionBlock(config, {
      transactionBlock: new Uint8Array(),
      signature: ["sig1", "sig2"],
    });

    expect(result).toEqual({
      digest: "transaction_digest_123",
      effects: {
        status: { status: "failure", error: "missing effects in broadcast response" },
      },
    });
    expect(mockExecute).toHaveBeenCalledWith(mockGrpcClient, new Uint8Array(), ["sig1", "sig2"]);
  });
});

describe("Staking Operations", () => {
  describe("Operation Type Detection", () => {
    const address = SENDER;
    test("getOperationType should return DELEGATE for staking transaction", () => {
      expect(sdk.getOperationType(address, mockStakingTx(address, mist(-1)))).toBe("DELEGATE");
    });

    test("getOperationType should return UNDELEGATE for unstaking transaction", () => {
      expect(sdk.getOperationType(address, mockUnstakingTx(address, mist(1)))).toBe("UNDELEGATE");
    });

    function prependOtherMoveCall(block: SuiTransactionKind) {
      if (block.kind === "ProgrammableTransaction") {
        block.transactions.unshift({
          MoveCall: { function: "other_function", module: "module", package: "package" },
        });
      }
    }

    test("getOperationType should return UNDELEGATE when it's not the first MoveCall", () => {
      const tx = mockUnstakingTx(address, "1000");
      prependOtherMoveCall(tx.transaction.data.transaction);
      expect(sdk.getOperationType(address, tx)).toBe("UNDELEGATE");
    });

    test("getOperationType should return DELEGATE when it's not the first MoveCall", () => {
      const tx = mockStakingTx(address, "-1000");
      prependOtherMoveCall(tx.transaction.data.transaction);
      expect(sdk.getOperationType(address, tx)).toBe("DELEGATE");
    });
  });

  describe("Operation Amount Calculation", () => {
    const address = RECIPIENT;

    function bridgeOperationAmount(
      mock: SuiTransactionResponse,
      coinType: string = sdk.DEFAULT_COIN_TYPE,
    ) {
      return sdk.getOperationAmount(address, mock, coinType);
    }

    test("getOperationAmount should calculate staking amount", () =>
      expect(bridgeOperationAmount(mockStakingTx(address, mist(-1)))).toEqual(
        new BigNumber(mist(1)),
      ));

    test("getOperationAmount should calculate unstaking amount of 1000", () =>
      expect(bridgeOperationAmount(mockUnstakingTx(address, "1000"))).toEqual(
        new BigNumber("-1000"),
      ));

    test("getOperationAmount should calculate unstaking amount of 0", () =>
      expect(bridgeOperationAmount(mockUnstakingTx(address, "0"))).toEqual(new BigNumber("0")));

    test("getOperationAmount should calculate amount correctly for SUI", () =>
      expect(bridgeOperationAmount(mockTransaction)).toEqual(new BigNumber("9998990120")));

    test("getOperationAmount should calculate amount correctly for tokens", () =>
      expect(bridgeOperationAmount(mockTransaction, "0x123::test::TOKEN")).toEqual(
        new BigNumber("500000"),
      ));

    function operationAmountCoinFramework(
      mock: SuiTransactionResponse,
      coinType: string = sdk.DEFAULT_COIN_TYPE,
    ) {
      return sdk.getOperationAmountCoinFramework(address, mock, coinType);
    }

    test("coin-framework getOperationAmount should calculate staking amount", () =>
      expect(operationAmountCoinFramework(mockStakingTx(address, "-1001050000"))).toEqual(
        new BigNumber(mist(1)),
      ));

    // 1000 unstaked & 1050000 gas fees = -1049000 balance change
    test("coin-framework getOperationAmount should calculate unstaking amount of 1000", () =>
      expect(operationAmountCoinFramework(mockUnstakingTx(address, "-1049000"))).toEqual(
        new BigNumber("1000"),
      ));

    test("coin-framework getOperationAmount should calculate unstaking amount of 0", () =>
      expect(operationAmountCoinFramework(mockUnstakingTx(address, "-1050000"))).toEqual(
        new BigNumber("0"),
      ));

    test("coin-framework getOperationAmount should calculate amount correctly for SUI", () =>
      expect(operationAmountCoinFramework(mockTransaction)).toEqual(new BigNumber("9998990120")));

    test("coin-framework getOperationAmount should calculate amount correctly for tokens", () =>
      expect(operationAmountCoinFramework(mockTransaction, "0x123::test::TOKEN")).toEqual(
        new BigNumber("500000"),
      ));
  });

  describe("Operation Recipients", () => {
    test("getOperationRecipients should return empty array for staking transaction", () => {
      const recipients = sdk.getOperationRecipients(
        mockStakingTx("0xdeadbeef", mist(-1)).transaction.data,
      );
      expect(recipients).toEqual([]);
    });

    test("getOperationRecipients should return empty array for unstaking transaction", () => {
      const recipients = sdk.getOperationRecipients(
        mockUnstakingTx("0xdeadbeef", mist(1)).transaction.data,
      );
      expect(recipients).toEqual([]);
    });
  });

  describe("Transaction Creation", () => {
    const address = SENDER;
    const delegate = {
      mode: "delegate" as const,
      coinType: sdk.DEFAULT_COIN_TYPE,
      amount: new BigNumber(ONE_SUI),
      recipient: "0xvalidator_address_123",
    };
    const undelegate = {
      mode: "undelegate" as const,
      coinType: sdk.DEFAULT_COIN_TYPE,
      amount: new BigNumber(ONE_SUI / 2),
      stakedSuiId: "0xstaked_sui_object_123",
      useAllAmount: false,
      recipient: "0xvalidator_address_123",
    };
    const addressBalanceOnly: MockBalance[] = [
      { coinType: sdk.DEFAULT_COIN_TYPE, totalBalance: mist(1), fundsInAddressBalance: mist(1) },
    ];

    test("createTransaction should build delegate transaction", async () => {
      const tx = await sdk.createTransaction(config, address, delegate);
      expect(tx).toEqual({ unsigned: { transactionBlock: expect.any(Uint8Array) } });
    });

    test("createTransaction should build undelegate transaction with specific amount", async () => {
      const tx = await sdk.createTransaction(config, address, undelegate);
      expect(tx).toEqual({ unsigned: { transactionBlock: expect.any(Uint8Array) } });
    });

    test("createTransaction sets empty gas payment for delegate when funds are in address balance", async () => {
      mockGetAllBalances.mockResolvedValueOnce(addressBalanceOnly);

      const tx = await sdk.createTransaction(config, address, delegate);
      expect(tx).toEqual({ unsigned: { transactionBlock: expect.any(Uint8Array) } });
      expect(mockGetAllBalances).toHaveBeenCalledWith(address);
      expect(lastTransactionInstance().setGasPayment).toHaveBeenCalledWith([]);
    });

    test("createTransaction sets empty gas payment for undelegate when funds are in address balance", async () => {
      mockGetAllBalances.mockResolvedValueOnce(addressBalanceOnly);

      const tx = await sdk.createTransaction(config, address, undelegate);
      expect(tx).toEqual({ unsigned: { transactionBlock: expect.any(Uint8Array) } });
      expect(lastTransactionInstance().setGasPayment).toHaveBeenCalledWith([]);
    });

    test("createTransaction should build undelegate transaction with all amount", async () => {
      const tx = await sdk.createTransaction(config, address, {
        ...undelegate,
        amount: new BigNumber(0),
        useAllAmount: true,
      });
      expect(tx).toEqual({ unsigned: { transactionBlock: expect.any(Uint8Array) } });
    });
  });

  describe("Payment Info for Staking", () => {
    const sender = SENDER;

    test("paymentInfo should return gas budget and fees for delegate transaction", async () => {
      const info = await sdk.paymentInfo(config, sender, {
        mode: "delegate",
        coinType: sdk.DEFAULT_COIN_TYPE,
        family: "sui",
        amount: new BigNumber(ONE_SUI),
        recipient: "0xvalidator_address_123",
        errors: {},
      });
      expect(info).toEqual({ gasBudget: "4000000", totalGasUsed: 1050000n, fees: 1050000n });
    });

    test("paymentInfo should return gas budget and fees for undelegate transaction", async () => {
      const info = await sdk.paymentInfo(config, sender, {
        mode: "undelegate",
        coinType: sdk.DEFAULT_COIN_TYPE,
        family: "sui",
        amount: new BigNumber(ONE_SUI / 2),
        stakedSuiId: "0xstaked_sui_object_123",
        useAllAmount: false,
        recipient: "0xvalidator_address_123",
        errors: {},
      });
      expect(info).toEqual({ gasBudget: "4000000", totalGasUsed: 1050000n, fees: 1050000n });
    });

    test("paymentInfo works when sender has no coin objects (SIP-58 address balance only)", async () => {
      mockGetCoins.mockResolvedValue({ data: [], hasNextPage: false });

      const info = await sdk.paymentInfo(
        config,
        sender,
        sendTransaction({ amount: new BigNumber(ONE_SUI) }),
      );
      expect(info).toHaveProperty("gasBudget");
      expect(info).toHaveProperty("totalGasUsed");
      expect(info).toHaveProperty("fees");
    });

    test("paymentInfo does not call getInputObjects (dry run optimisation)", async () => {
      mockGrpcClient.core.getObjects.mockClear();
      await sdk.paymentInfo(config, sender, sendTransaction({ amount: new BigNumber(ONE_SUI) }));
      expect(mockGrpcClient.core.getObjects).not.toHaveBeenCalled();
    });
  });

  describe("Transaction to Operation Mapping", () => {
    const address = SENDER;

    test("transactionToOperation should map staking transaction correctly", () => {
      const accountId = "mockAccountId";
      const operation = sdk.transactionToOperation(
        accountId,
        address,
        mockStakingTx(address, mist(-1)),
      );

      expect(operation).toHaveProperty("id");
      expect(operation).toHaveProperty("accountId", accountId);
      expect(operation).toHaveProperty("type", "DELEGATE");
      expect(operation).toHaveProperty("hash", "delegate_tx_digest_123");
      const stakingExtra = operation.extra as {
        coinType: string;
        validatorAddress: string;
        stakedAmount: string;
      };
      expect(stakingExtra.coinType).toBe(sdk.DEFAULT_COIN_TYPE);
      expect(stakingExtra.validatorAddress).toBe(VALIDATOR);
      expect(stakingExtra.stakedAmount).toBe(String(ONE_SUI));
      // Staking negates the (negative) balance change into a positive value.
      expect(operation.value).toEqual(new BigNumber(mist(1)));
      expect(operation.recipients).toEqual([]);
      expect(operation.senders).toEqual([address]);
    });

    test("transactionToOperation should map unstaking transaction correctly", () => {
      const accountId = "mockAccountId";
      const operation = sdk.transactionToOperation(
        accountId,
        address,
        mockUnstakingTx(address, mist(1)),
      );

      expect(operation).toHaveProperty("id");
      expect(operation).toHaveProperty("accountId", accountId);
      expect(operation).toHaveProperty("type", "UNDELEGATE");
      expect(operation).toHaveProperty("hash", "undelegate_tx_digest_456");
      const unstakingExtra = operation.extra as {
        coinType: string;
        validatorAddress: string;
        stakedAmount: string;
      };
      expect(unstakingExtra.coinType).toBe(sdk.DEFAULT_COIN_TYPE);
      expect(unstakingExtra.validatorAddress).toBe(VALIDATOR);
      // `principal_amount` from the unstaking event — see mockUnstakingTx.
      expect(unstakingExtra.stakedAmount).toBe(mist(1.2));
      expect(operation.value).toEqual(new BigNumber(mist(-1)));
      expect(operation.recipients).toEqual([]);
      expect(operation.senders).toEqual([address]);
    });

    test("transactionToOperation leaves extra clean for non-staking transfers", () => {
      const sender = "0xsender";
      const tx = makeTx({
        digest: "transfer_tx_digest_123",
        balanceChanges: [{ address: sender, coinType: sdk.DEFAULT_COIN_TYPE, amount: "-1000" }],
        checkpoint: "1",
      });
      const op = sdk.transactionToOperation("mockAccountId", sender, tx);
      const extra = op.extra as Record<string, unknown>;
      expect(extra.validatorAddress).toBeUndefined();
      expect(extra.stakedAmount).toBeUndefined();
    });

    test("transactionToOp should map staking transaction correctly", () => {
      const operation = sdk.transactionToCoinFrameworkOperation(
        address,
        mockStakingTx(address, "-1001050000"),
        "mockCheckpointHash",
      );

      expect(operation).toMatchObject({
        id: "delegate_tx_digest_123",
        type: "DELEGATE",
        senders: [address],
        recipients: [],
        value: 0n,
        asset: { type: "native" },
        tx: { block: expect.any(Object), feesPayer: address },
        details: {
          stakedAmount: BigInt(ONE_SUI),
          validatorAddress: VALIDATOR,
          stakedObjectId: "0xstaked_object_id_123",
        },
      });
    });

    test("transactionToOp should map unstaking transaction correctly", () => {
      const operation = sdk.transactionToCoinFrameworkOperation(
        address,
        mockUnstakingTx(address, "998950000"),
        "mockCheckpointHash",
      );
      expect(operation).toMatchObject({
        id: "undelegate_tx_digest_456",
        type: "UNDELEGATE",
        senders: [address],
        recipients: [],
        value: 0n,
        asset: { type: "native" },
        tx: { block: expect.any(Object), feesPayer: address },
        details: {
          stakedAmount: BigInt(ONE_SUI),
          validatorAddress: VALIDATOR,
          rewardAmount: BigInt(ONE_SUI / 20),
          withdrawnAmount: BigInt((6 * ONE_SUI) / 5),
        },
      });
    });

    test("transactionToOp should return staking details without events", () => {
      const tx = { ...mockStakingTx(address, "-1001050000"), events: [] };
      const operation = sdk.transactionToCoinFrameworkOperation(address, tx, "mockCheckpointHash");
      expect(operation.details).toEqual({ stakedAmount: BigInt(ONE_SUI) });
    });

    test("transactionToOp should return unstaking details without events", () => {
      const tx = { ...mockUnstakingTx(address, "998950000"), events: [] };
      const operation = sdk.transactionToCoinFrameworkOperation(address, tx, "mockCheckpointHash");
      expect(operation.details).toEqual({ stakedAmount: BigInt(ONE_SUI) });
    });

    test("transactionToOp should handle partial staking event fields", () => {
      const tx = {
        ...mockStakingTx(address, "-1001050000"),
        events: [
          {
            type: "0x3::validator::StakingRequestEvent",
            parsedJson: { validator_address: "0xabc" },
          },
        ],
      };
      const operation = sdk.transactionToCoinFrameworkOperation(address, tx, "mockCheckpointHash");
      expect(operation.details).toEqual({
        stakedAmount: BigInt(ONE_SUI),
        validatorAddress: "0xabc",
      });
    });

    test("transactionToOp should handle partial unstaking event fields", () => {
      const tx = {
        ...mockUnstakingTx(address, "998950000"),
        events: [
          {
            type: "0x3::validator::UnstakingRequestEvent",
            parsedJson: { validator_address: "0xdef" },
          },
        ],
      };
      const operation = sdk.transactionToCoinFrameworkOperation(address, tx, "mockCheckpointHash");
      expect(operation.details).toEqual({
        stakedAmount: BigInt(ONE_SUI),
        validatorAddress: "0xdef",
      });
    });

    test("transactionToOp should use gasData.owner as feesPayer for sponsored transactions", () => {
      const sponsorAddress = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
      const operation = sdk.transactionToCoinFrameworkOperation(
        address,
        withGasOwner(mockTransaction, sponsorAddress),
        "mockCheckpointHash",
      );
      expect(operation.tx.feesPayer).toBe(sponsorAddress);
    });
  });
});

describe("getStakingExtraByDigest on the gRPC transport", () => {
  beforeEach(() => {
    mockStakingEvents.mockReset();
  });

  it("reads validator_address + amount from StakingRequestEvent (DELEGATE)", async () => {
    mockStakingEvents.mockResolvedValueOnce([
      {
        type: "0x3::validator::StakingRequestEvent",
        parsedJson: { validator_address: "0xval", amount: "1000000000" },
      },
    ]);
    const out = await sdk.getStakingExtraByDigest(config, "0xdigest", "DELEGATE");
    expect(out).toEqual({ validatorAddress: "0xval", stakedAmount: "1000000000" });
    expect(mockStakingEvents).toHaveBeenCalledWith(mockGrpcClient, "0xdigest");
  });

  it("returns null when the digest has no matching staking event", async () => {
    mockStakingEvents.mockResolvedValueOnce([]);
    const out = await sdk.getStakingExtraByDigest(config, "0xmissing", "DELEGATE");
    expect(out).toBeNull();
  });
});

describe("getStakingEventDetails", () => {
  const withEvents = (events: SuiTransactionResponse["events"]) => makeTx({ events });

  it("should extract all fields from StakingRequestEvent", () => {
    const tx = withEvents([
      {
        type: "0x3::validator::StakingRequestEvent",
        parsedJson: { validator_address: "0xabc", staked_sui_id: "0xobj123" },
      },
    ]);
    expect(sdk.getStakingEventDetails(tx)).toEqual({
      validatorAddress: "0xabc",
      stakedObjectId: "0xobj123",
    });
  });

  it("should extract all fields from UnstakingRequestEvent", () => {
    const tx = withEvents([
      {
        type: "0x3::validator::UnstakingRequestEvent",
        parsedJson: {
          validator_address: "0xdef",
          reward_amount: mist(0.05),
          principal_amount: mist(1.2),
        },
      },
    ]);
    expect(sdk.getStakingEventDetails(tx)).toEqual({
      validatorAddress: "0xdef",
      rewardAmount: BigInt(ONE_SUI / 20),
      withdrawnAmount: BigInt((6 * ONE_SUI) / 5),
    });
  });

  it("should handle partial StakingRequestEvent fields", () => {
    const tx = withEvents([
      { type: "0x3::validator::StakingRequestEvent", parsedJson: { validator_address: "0xabc" } },
    ]);
    expect(sdk.getStakingEventDetails(tx)).toEqual({ validatorAddress: "0xabc" });
  });

  it("should handle partial UnstakingRequestEvent fields", () => {
    const tx = withEvents([
      {
        type: "0x3::validator::UnstakingRequestEvent",
        parsedJson: { validator_address: "0xdef" },
      },
    ]);
    expect(sdk.getStakingEventDetails(tx)).toEqual({ validatorAddress: "0xdef" });
  });

  it("should return empty object when no staking events", () => {
    expect(sdk.getStakingEventDetails(withEvents([]))).toEqual({});
  });

  it("matches a GraphQL (long-form) StakingRequestEvent after adapter normalisation", () => {
    const tx = graphqlTxToSuiTransaction({
      digest: "0xstake",
      transactionJson: {},
      effects: {
        status: "SUCCESS",
        events: {
          nodes: [
            {
              contents: {
                type: {
                  repr: "0x0000000000000000000000000000000000000000000000000000000000000003::validator::StakingRequestEvent",
                },
                json: { validator_address: "0xabc", staked_sui_id: "0xobj123" },
              },
            },
          ],
        },
      },
    } as unknown as GraphQLTransactionNode);

    expect(tx.events[0].type).toBe("0x3::validator::StakingRequestEvent");
    expect(sdk.getStakingEventDetails(tx)).toEqual({
      validatorAddress: "0xabc",
      stakedObjectId: "0xobj123",
    });
  });
});

describe("conversion methods", () => {
  test("toBlockOperation should map native transfers correctly", () => {
    expect(
      sdk.toBlockOperation(
        mockTransaction,
        { address: "0x65449f57946938c84c5127", coinType: sdk.DEFAULT_COIN_TYPE, amount: mist(-10) },
        BigNumber(0),
      ),
    ).toEqual([
      {
        type: "transfer",
        address: "0x65449f57946938c84c5127",
        peer: SENDER,
        amount: BigInt(-10 * ONE_SUI),
        asset: { type: "native" },
      },
    ]);
  });

  test("toBlockOperation should map token transfers correctly", () => {
    const usdc = "0x168da5bf1f48dafc111b0a488fa454aca95e0b5e::usdc::USDC";
    expect(
      sdk.toBlockOperation(
        mockTransaction,
        { address: "0x65449f57946938c84c5127", coinType: usdc, amount: "8824" },
        BigNumber(0),
      ),
    ).toEqual([
      {
        type: "transfer",
        address: "0x65449f57946938c84c5127",
        peer: SENDER,
        amount: 8824n,
        asset: { type: "token", assetReference: usdc },
      },
    ]);
  });

  test("toBlockOperation should map staking operations correctly", () => {
    expect(
      sdk.toBlockOperation(
        mockStakingTx(SENDER, mist(-1)),
        { address: SENDER, coinType: sdk.DEFAULT_COIN_TYPE, amount: mist(-10) },
        BigNumber(0),
      ),
    ).toEqual([
      {
        type: "other",
        operationType: "DELEGATE",
        address: SENDER,
        asset: { type: "native" },
        stakedAmount: BigInt(-10 * ONE_SUI),
      },
    ]);
  });

  test("toBlockOperation should map unstaking operations correctly", () => {
    expect(
      sdk.toBlockOperation(
        mockUnstakingTx(SENDER, mist(1)),
        { address: SENDER, coinType: sdk.DEFAULT_COIN_TYPE, amount: mist(10) },
        BigNumber(0),
      ),
    ).toEqual([
      {
        type: "other",
        operationType: "UNDELEGATE",
        address: SENDER,
        asset: { type: "native" },
        stakedAmount: BigInt(10 * ONE_SUI),
      },
    ]);
  });

  test("toBlockInfo should map checkpoints correctly", () => {
    expect(
      sdk.toBlockInfo({
        digest: "0xaaaaaaaaa",
        previousDigest: "0xbbbbbbbbbb",
        sequenceNumber: "42",
        timestampMs: "1751696298663",
      }),
    ).toEqual({
      height: 42,
      hash: "0xaaaaaaaaa",
      time: new Date(1751696298663),
      parent: { height: 41, hash: "0xbbbbbbbbbb" },
    });
  });

  test("toBlockTransaction should map transactions correctly", () => {
    expect(sdk.toBlockTransaction(mockTransaction)).toEqual({
      hash: "DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt",
      failed: false,
      fees: 1009880n,
      feesPayer: SENDER,
      operations: [
        {
          address: SENDER,
          peer: RECIPIENT,
          amount: -9998990120n,
          asset: { type: "native" },
          type: "transfer",
        },
        {
          address: RECIPIENT,
          peer: SENDER,
          amount: 9998990120n,
          asset: { type: "native" },
          type: "transfer",
        },
        {
          address: RECIPIENT,
          peer: SENDER,
          amount: 500000n,
          asset: { type: "token", assetReference: "0x123::test::TOKEN" },
          type: "transfer",
        },
      ],
    });
  });

  test("toBlockTransaction should use gasData.owner as feesPayer for sponsored transactions", () => {
    const sponsorAddress = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const result = sdk.toBlockTransaction(withGasOwner(mockTransaction, sponsorAddress));
    expect(result.feesPayer).toBe(sponsorAddress);
  });

  test("toBlockTransaction should not include feesPayer when gasData.owner is missing or empty", () => {
    expect(sdk.toBlockTransaction(withGasOwner(mockTransaction, undefined))).not.toHaveProperty(
      "feesPayer",
    );
    expect(sdk.toBlockTransaction(withGasOwner(mockTransaction, ""))).not.toHaveProperty(
      "feesPayer",
    );
  });

  test("toSuiAsset should map native coin correctly", () => {
    expect(sdk.toSuiAsset(sdk.DEFAULT_COIN_TYPE)).toEqual({ type: "native" });
  });

  test("toSuiAsset should map tokens correctly", () => {
    expect(sdk.toSuiAsset("0x123::test::TOKEN")).toEqual({
      type: "token",
      assetReference: "0x123::test::TOKEN",
    });
  });
});

describe("getCoinsForAmount", () => {
  const mockAddress = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
  const mockCoinType = "0x2::sui::SUI";

  beforeEach(() => {
    mockGetCoins.mockReset();
  });

  describe("basic functionality", () => {
    test("handles single coin scenarios", async () => {
      mockGetCoins.mockResolvedValueOnce({ data: createMockCoins(["1000"]), hasNextPage: false });

      let result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 1000n);
      expect(result).toHaveLength(1);
      expect(result[0].balance).toBe("1000");

      mockGetCoins.mockResolvedValueOnce({ data: createMockCoins(["500"]), hasNextPage: false });

      result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 1000n);
      expect(result).toHaveLength(1);
      expect(result[0].balance).toBe("500");
    });

    test("selects minimum coins needed", async () => {
      mockGetCoins.mockResolvedValueOnce({
        data: createMockCoins(["600", "400", "300"]),
        hasNextPage: false,
      });

      let result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 1000n);
      expect(result).toHaveLength(2);
      expect(result[0].balance).toBe("600");
      expect(result[1].balance).toBe("400");

      mockGetCoins.mockResolvedValueOnce({
        data: createMockCoins(["800", "400", "200"]),
        hasNextPage: false,
      });

      result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 1000n);
      expect(result).toHaveLength(2);
      expect(result[0].balance).toBe("800");
      expect(result[1].balance).toBe("400");
    });

    test("handles edge cases", async () => {
      mockGetCoins.mockResolvedValueOnce({ data: [], hasNextPage: false });

      let result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 1000n);
      expect(result).toHaveLength(0);

      mockGetCoins.mockResolvedValueOnce({ data: createMockCoins(["1000"]), hasNextPage: false });

      result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 0n);
      expect(result).toHaveLength(0);
    });
  });

  describe("sorting and filtering", () => {
    test("filters zero balance coins", async () => {
      const mockCoins = createMockCoins(["1000", "500"]);
      mockCoins.splice(1, 0, createMockCoins(["0"])[0]);
      mockCoins.push({ coinObjectId: "0xcoin4", balance: "0", digest: "0xdigest4", version: "1" });

      mockGetCoins.mockResolvedValueOnce({ data: mockCoins, hasNextPage: false });

      const result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 1000n);

      expect(result).toHaveLength(1);
      expect(result[0].balance).toBe("1000");
      expect(result.every(coin => Number.parseInt(coin.balance, 10) > 0)).toBe(true);
    });

    test("sorts and optimizes coin selection", async () => {
      mockGetCoins.mockResolvedValueOnce({
        data: createMockCoins(["100", "800", "300", "500"]),
        hasNextPage: false,
      });

      let result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 1000n);
      expect(result).toHaveLength(2);
      expect(result[0].balance).toBe("800");
      expect(result[1].balance).toBe("500");

      const mixedCoins = createMockCoins(["200", "800", "400"]);
      mixedCoins.unshift(createMockCoins(["0"])[0]);
      mixedCoins.splice(2, 0, createMockCoins(["0"])[0]);

      mockGetCoins.mockResolvedValueOnce({ data: mixedCoins, hasNextPage: false });

      result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 1000n);
      expect(result).toHaveLength(2);
      expect(result[0].balance).toBe("800");
      expect(result[1].balance).toBe("400");
      expect(result.every(coin => Number.parseInt(coin.balance, 10) > 0)).toBe(true);
    });

    test("handles all zero balance coins", async () => {
      mockGetCoins.mockResolvedValueOnce({
        data: createMockCoins(["0", "0", "0"]),
        hasNextPage: false,
      });

      const result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 1000n);

      expect(result).toEqual([]);
    });
  });

  describe("pagination", () => {
    test("handles single page scenarios", async () => {
      mockGetCoins.mockResolvedValueOnce({
        data: createMockCoins(["800", "400", "300"]),
        hasNextPage: true,
        nextCursor: "cursor1",
      });

      const result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 1000n);

      expect(result).toHaveLength(2);
      expect(result[0].balance).toBe("800");
      expect(result[1].balance).toBe("400");
      expect(mockGetCoins).toHaveBeenCalledTimes(1);
    });

    test("handles multi-page scenarios", async () => {
      mockGetCoins
        .mockResolvedValueOnce({
          data: createMockCoins(["300", "200"]),
          hasNextPage: true,
          nextCursor: "cursor1",
        })
        .mockResolvedValueOnce({
          data: createMockCoins(["600", "400", "100"]),
          hasNextPage: false,
        });

      const result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 1000n);

      expect(result).toHaveLength(3);
      expect(result[0].balance).toBe("300");
      expect(result[1].balance).toBe("200");
      expect(result[2].balance).toBe("600");
      expect(mockGetCoins).toHaveBeenCalledTimes(2);
      expect(mockGetCoins).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: "cursor1" }));
    });

    test("handles insufficient funds across pages", async () => {
      mockGetCoins
        .mockResolvedValueOnce({
          data: createMockCoins(["300", "200"]),
          hasNextPage: true,
          nextCursor: "cursor1",
        })
        .mockResolvedValueOnce({ data: createMockCoins(["200", "100"]), hasNextPage: false });

      const result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 1000n);

      expect(result).toHaveLength(4);
      expect(result.map(c => c.balance)).toEqual(["300", "200", "200", "100"]);
      expect(mockGetCoins).toHaveBeenCalledTimes(2);
    });
  });
});

describe("getCoinsForAmount – SIP-58 fake coins", () => {
  const mockAddress = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
  const mockCoinType = "0x123::test::TOKEN";
  const fakeCoin = (balance: string): MockCoin => ({
    coinObjectId: "0xfake_address_balance_coin",
    balance,
    digest: "0xfakedigest",
    version: "1",
  });

  beforeEach(() => {
    mockGetCoins.mockReset();
  });

  test("selects a single fake coin representing address balance", async () => {
    mockGetCoins.mockResolvedValueOnce({ data: [fakeCoin("5000")], hasNextPage: false });

    const result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 3000n);

    expect(result).toHaveLength(1);
    expect(result[0].coinObjectId).toBe("0xfake_address_balance_coin");
    expect(result[0].balance).toBe("5000");
  });

  test("selects a mix of real coins and fake address-balance coin", async () => {
    const realCoin: MockCoin = {
      coinObjectId: "0xreal_coin_1",
      balance: "2000",
      digest: "0xdigest1",
      version: "1",
    };
    mockGetCoins.mockResolvedValueOnce({ data: [realCoin, fakeCoin("3000")], hasNextPage: false });

    const result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 4000n);

    expect(result).toHaveLength(2);
    expect(
      Number.parseInt(result[0].balance, 10) + Number.parseInt(result[1].balance, 10),
    ).toBeGreaterThanOrEqual(4000);
  });

  test("handles account with address balance only (no real coin objects)", async () => {
    mockGetCoins.mockResolvedValueOnce({ data: [fakeCoin("10000")], hasNextPage: false });

    const result = await sdk.getCoinsForAmount(coreClient, mockAddress, mockCoinType, 8000n);

    expect(result).toHaveLength(1);
    expect(result[0].balance).toBe("10000");
  });
});

const PADDED_ACCUMULATOR_ROOT_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000acc";

const settlementKind = (input: SuiInput): SuiTransactionKind => ({
  kind: "ProgrammableTransaction",
  inputs: [input],
  transactions: [],
});

const makeSettlementTx = (
  objectId = PADDED_ACCUMULATOR_ROOT_ID,
  mutable = true,
): SuiTransactionResponse =>
  makeTx({
    digest: "settlement-digest",
    timestampMs: "1000",
    checkpoint: "100",
    transaction: {
      data: {
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
        gasData: { owner: "0x0" },
        transaction: settlementKind({
          type: "object",
          objectType: "sharedObject",
          objectId,
          mutable,
        }),
      },
    },
  });

const withKind = (
  tx: SuiTransactionResponse,
  kind: SuiTransactionKind,
): SuiTransactionResponse => ({
  ...tx,
  transaction: { data: { ...tx.transaction.data, transaction: kind } },
});

describe("isSettlementTransaction", () => {
  it("returns true for a settlement tx with the padded accumulator root object input", () => {
    expect(sdk.isSettlementTransaction(makeSettlementTx())).toBe(true);
  });

  it("returns true for the short-form 0xacc object input", () => {
    expect(sdk.isSettlementTransaction(makeSettlementTx("0xacc"))).toBe(true);
  });

  it("returns true for a mixed-case padded accumulator root object input", () => {
    const tx = makeSettlementTx(
      "0x0000000000000000000000000000000000000000000000000000000000000ACC",
    );
    expect(sdk.isSettlementTransaction(tx)).toBe(true);
  });

  it("returns false for a different padded system object input", () => {
    const tx = makeSettlementTx(
      "0x0000000000000000000000000000000000000000000000000000000000000005",
    );
    expect(sdk.isSettlementTransaction(tx)).toBe(false);
  });

  it("returns false when the accumulator root input is not mutable", () => {
    expect(sdk.isSettlementTransaction(makeSettlementTx(PADDED_ACCUMULATOR_ROOT_ID, false))).toBe(
      false,
    );
  });

  it("returns false for a normal user transaction", () => {
    expect(sdk.isSettlementTransaction(mockTransaction)).toBe(false);
  });

  it("returns false for system transaction kinds", () => {
    const tx = withKind(makeSettlementTx(), { kind: "System", name: "ChangeEpoch" });
    expect(sdk.isSettlementTransaction(tx)).toBe(false);
  });

  it("returns false when 0xacc appears as a pure input, not object", () => {
    const tx = withKind(
      makeSettlementTx(),
      settlementKind({ type: "pure", valueType: "address", value: "0xacc" }),
    );
    expect(sdk.isSettlementTransaction(tx)).toBe(false);
  });
});

describe("getUnifiedBalanceChanges", () => {
  const addr = "0xaaa";
  const coinType = "0x2::sui::SUI";
  const merge = (address: string, integer: string, ty = coinType): SuiAccumulatorEvent => ({
    address,
    operation: "merge",
    ty,
    value: { integer },
  });

  it("returns balanceChanges as-is when no accumulator events", () => {
    const changes: SuiBalanceChange[] = [{ address: addr, coinType, amount: "-500" }];
    expect(sdk.getUnifiedBalanceChanges(makeTx({ balanceChanges: changes }))).toEqual(changes);
  });

  it("returns empty array when neither balanceChanges nor accumulatorEvents exist", () => {
    expect(sdk.getUnifiedBalanceChanges(makeTx())).toEqual([]);
  });

  it("merges accumulator merge event as positive balance change", () => {
    const tx = withAccumulatorEvents(
      makeTx({ balanceChanges: [{ address: "0xsender", coinType, amount: "-1000" }] }),
      [merge(addr, "1000")],
    );

    const result = sdk.getUnifiedBalanceChanges(tx);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ address: addr, coinType, amount: "1000" });
  });

  it("merges accumulator split event as negative balance change", () => {
    const tx = withAccumulatorEvents(makeTx(), [
      { address: addr, operation: "split", ty: coinType, value: { integer: "500" } },
    ]);

    expect(sdk.getUnifiedBalanceChanges(tx)).toEqual([{ address: addr, coinType, amount: "-500" }]);
  });

  it("normalises a long-form (Balance-wrapped) accumulator event ty to the short coinType", () => {
    const tx = withAccumulatorEvents(makeTx(), [
      merge(
        addr,
        "1000",
        "0x0000000000000000000000000000000000000000000000000000000000000002::balance::Balance<0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI>",
      ),
    ]);

    expect(sdk.getUnifiedBalanceChanges(tx)).toEqual([
      { address: addr, coinType: "0x2::sui::SUI", amount: "1000" },
    ]);
  });

  it("skips accumulator event when balanceChanges already covers the address+coinType", () => {
    const tx = withAccumulatorEvents(
      makeTx({ balanceChanges: [{ address: addr, coinType, amount: "1000" }] }),
      [merge(addr, "1000")],
    );

    const result = sdk.getUnifiedBalanceChanges(tx);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe("1000");
  });

  it("merges multiple accumulator events for different addresses", () => {
    const tx = withAccumulatorEvents(
      makeTx({ balanceChanges: [{ address: "0xsender", coinType, amount: "-2000" }] }),
      [merge("0xrecip1", "800"), merge("0xrecip2", "1200")],
    );

    const result = sdk.getUnifiedBalanceChanges(tx);
    expect(result).toHaveLength(3);
    expect(result[1]).toEqual({ address: "0xrecip1", coinType, amount: "800" });
    expect(result[2]).toEqual({ address: "0xrecip2", coinType, amount: "1200" });
  });
});

describe("accumulator events through modified functions", () => {
  const coinType = "0x2::sui::SUI";

  const baseTxWithAccumulator = withAccumulatorEvents(
    makeTx({
      ...mockTransaction,
      digest: "acc-tx-digest",
      balanceChanges: [{ address: SENDER, coinType, amount: "-6000000000" }],
    }),
    [{ address: RECIPIENT, operation: "merge", ty: coinType, value: { integer: mist(5) } }],
  );

  test("getOperationAmount includes accumulator merge for recipient", () => {
    const amount = sdk.getOperationAmount(RECIPIENT, baseTxWithAccumulator, coinType);
    expect(amount).toEqual(new BigNumber(mist(5)));
  });

  test("getOperationAmount returns sender's balance change unaffected", () => {
    const amount = sdk.getOperationAmount(SENDER, baseTxWithAccumulator, coinType);
    expect(amount).toEqual(new BigNumber(mist(6)));
  });

  test("getOperationAmountCoinFramework includes accumulator merge for recipient", () => {
    const amount = sdk.getOperationAmountCoinFramework(RECIPIENT, baseTxWithAccumulator, coinType);
    expect(amount).toEqual(new BigNumber(mist(5)));
  });

  test("getOperationCoinType detects token from accumulator event", () => {
    const tokenType = "0x123::test::TOKEN";
    const tx = withAccumulatorEvents(
      {
        ...baseTxWithAccumulator,
        balanceChanges: [{ address: SENDER, coinType, amount: "-1009880" }],
      },
      [{ address: RECIPIENT, operation: "merge", ty: tokenType, value: { integer: "500000" } }],
    );

    expect(sdk.getOperationCoinType(tx)).toBe(tokenType);
  });

  test("toBlockTransaction includes operations from accumulator events", () => {
    const result = sdk.toBlockTransaction(baseTxWithAccumulator);
    expect(result.operations).toHaveLength(2);
    expect(result.operations[1]).toMatchObject({
      type: "transfer",
      address: RECIPIENT,
      amount: BigInt(5 * ONE_SUI),
      asset: { type: "native" },
    });
  });
});

describe("settlement transaction filtering in operations", () => {
  const normalTx = makeTx({ ...mockTransaction, digest: "normal-tx", timestampMs: "2000" });
  const settlementTx = makeTx({
    ...makeSettlementTx(),
    digest: "settlement-tx",
    checkpoint: "50",
    balanceChanges: [{ address: SENDER, coinType: "0x2::sui::SUI", amount: mist(0.5) }],
  });

  it("getOperations excludes settlement transactions", async () => {
    mockListHistory.mockResolvedValueOnce([normalTx, settlementTx]);

    const ops = await sdk.getOperations(config, "account-1", SENDER);

    expect(ops.map(o => o.hash)).toEqual(["normal-tx"]);
  });

  it("getListOperations excludes settlement transactions", async () => {
    mockListTransactions.mockResolvedValueOnce({ transactions: [normalTx, settlementTx] });

    const page = await sdk.getListOperations(config, SENDER, "desc");

    const hashes = page.items.map(op => op.tx.hash);
    expect(hashes).not.toContain("settlement-tx");
    expect(hashes).toContain("normal-tx");
  });
});

describe("getListOperations cursor parsing", () => {
  it.each([
    ["has no separator", "not-a-cursor", "missing timestamp or digest"],
    ["has a non-numeric timestamp", "abc:txhash", "invalid timestamp or digest"],
    ["has no digest", "1234:", "missing timestamp or digest"],
  ])("rejects a cursor that %s before querying", async (_label, cursor, reason) => {
    await expect(sdk.getListOperations(config, SENDER, "asc", cursor)).rejects.toThrow(
      `Invalid list operations cursor format: ${reason}`,
    );
    expect(mockListTransactions).not.toHaveBeenCalled();
  });
});
