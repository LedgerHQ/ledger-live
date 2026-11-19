import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { getTransactions } from "../logic/history/getTransactions";
import type { RosettaTransaction } from "../network/types";
import {
  makeTransactionsResponse,
  makeRosettaTransaction,
  makeBlockInfoResponse,
  makeNetworkStatusResponse,
  makeAccountBalanceResponse,
  makeEpochInfoResponse,
  makeDelegateAccountResponse,
  makeValidatorFromAPI,
  makeValidatorsPageResponse,
} from "../test/helpers/msw-fixtures";
import {
  server,
  rosettaHandlers,
  graphqlHandler,
  validatorsHandler,
} from "../test/helpers/msw-rosetta.mock";
import type { MinaAccount } from "../types/common";
import { getAccountShape, mapRosettaTxnToOperation } from "./synchronisation";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const ACCOUNT_ID = "js:2:mina:B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD:";
const ADDRESS = "B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD";
const OTHER_ADDRESS = "B62qkWcHhoisWDCR7v3gvWzX6wXEVuGYLHXq3mSym4GEzfYXmSDv314";

describe("mapRosettaTxnToOperation via MSW", () => {
  it("should map a payment transaction to an OUT operation when sending", async () => {
    const txn = makeRosettaTransaction({
      hash: "txn-out-001",
      fromAddress: ADDRESS,
      toAddress: OTHER_ADDRESS,
      feeValue: "-10000000",
      paymentValue: "500000000",
      timestamp: 1700000000000,
    });

    const ops = await mapRosettaTxnToOperation(ACCOUNT_ID, ADDRESS, txn);

    expect(ops).toHaveLength(1);
    expect(ops[0].type).toBe("OUT");
    expect(ops[0].senders).toEqual([ADDRESS]);
    expect(ops[0].recipients).toEqual([OTHER_ADDRESS]);
    expect(ops[0].fee.toNumber()).toBe(10000000);
  });

  it("should map a payment transaction to an IN operation when receiving", async () => {
    const txn = makeRosettaTransaction({
      hash: "txn-in-001",
      fromAddress: OTHER_ADDRESS,
      toAddress: ADDRESS,
      feeValue: "-10000000",
      paymentValue: "200000000",
      timestamp: 1700000000000,
    });

    const ops = await mapRosettaTxnToOperation(ACCOUNT_ID, ADDRESS, txn);

    expect(ops).toHaveLength(1);
    expect(ops[0].type).toBe("IN");
    expect(ops[0].senders).toEqual([OTHER_ADDRESS]);
    expect(ops[0].recipients).toEqual([ADDRESS]);
  });

  it("should map a delegate_change transaction to a DELEGATE operation", async () => {
    const tokenId = "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf";
    const delegateTxn: RosettaTransaction = {
      block_identifier: { index: 200, hash: "block-200" },
      transaction: {
        transaction_identifier: { hash: "delegate-txn-001" },
        operations: [
          {
            operation_identifier: { index: 0 },
            type: "fee_payment",
            status: "Success",
            account: { address: ADDRESS, metadata: { token_id: tokenId } },
            amount: { value: "-10000000", currency: { symbol: "MINA", decimals: 9 } },
          },
          {
            operation_identifier: { index: 1 },
            type: "delegate_change",
            status: "Success",
            account: { address: ADDRESS, metadata: { token_id: tokenId } },
            metadata: { delegate_change_target: OTHER_ADDRESS },
          },
        ],
      },
      timestamp: 1700000000000,
    };

    const ops = await mapRosettaTxnToOperation(ACCOUNT_ID, ADDRESS, delegateTxn);

    expect(ops).toHaveLength(1);
    expect(ops[0].type).toBe("DELEGATE");
    expect(ops[0].value.toNumber()).toBe(0);
    expect(ops[0].fee.toNumber()).toBe(10000000);
  });

  it("should fallback to getBlockInfo when timestamp is nullish", async () => {
    const txnNoTimestamp = {
      ...makeRosettaTransaction({ hash: "no-ts-txn" }),
      timestamp: undefined,
    } as unknown as RosettaTransaction;

    server.use(
      ...rosettaHandlers({
        "/block": () => makeBlockInfoResponse(100, { timestamp: 1700005000000 }),
      }),
    );

    const ops = await mapRosettaTxnToOperation(ACCOUNT_ID, ADDRESS, txnNoTimestamp);

    expect(ops).toHaveLength(1);
    expect(ops[0].date.getTime()).toBe(1700005000000);
  });
});

describe("getTransactions + mapRosettaTxnToOperation integration via MSW", () => {
  it("should fetch transactions and map them to operations", async () => {
    const txn1 = makeRosettaTransaction({
      hash: "txn-1",
      fromAddress: ADDRESS,
      toAddress: OTHER_ADDRESS,
      paymentValue: "100000000",
      timestamp: 1700001000000,
    });
    const txn2 = makeRosettaTransaction({
      hash: "txn-2",
      fromAddress: OTHER_ADDRESS,
      toAddress: ADDRESS,
      paymentValue: "50000000",
      timestamp: 1700000000000,
    });

    server.use(
      ...rosettaHandlers({
        "/search/transactions": () => makeTransactionsResponse([txn1, txn2]),
      }),
    );

    const txns = await getTransactions(ADDRESS);
    const ops = (
      await Promise.all(txns.flatMap(t => mapRosettaTxnToOperation(ACCOUNT_ID, ADDRESS, t)))
    ).flat();

    expect(ops.length).toBeGreaterThan(0);
    const types = ops.map(op => op.type);
    expect(types).toContain("OUT");
    expect(types).toContain("IN");
  });
});

describe("getAccountShape via MSW", () => {
  const VALIDATOR_ADDRESS = "B62qvalidator1";
  const MAPPED_VALIDATOR = {
    address: VALIDATOR_ADDRESS,
    name: "Test Validator",
    fee: 5,
    delegatorsCount: 100,
    validatorLogo: "https://img.example.com/v.png",
    identityName: "Test Validator",
    description: "A test validator",
    website: "https://example.com",
    stake: 1_000_000_000,
    delegations: 50,
    blocksCreated: 500,
  };
  const EPOCH_INFO = {
    epoch: "42",
    slot: "100",
    globalSlot: "30000",
    startTime: "1700000000000",
    endTime: "1700100000000",
  };
  const OUT_TXN = makeRosettaTransaction({
    hash: "txn-out",
    blockIndex: 101,
    fromAddress: ADDRESS,
    toAddress: OTHER_ADDRESS,
    paymentValue: "100000000",
    timestamp: 1700001000000,
  });
  const IN_TXN = makeRosettaTransaction({
    hash: "txn-in",
    blockIndex: 100,
    fromAddress: OTHER_ADDRESS,
    toAddress: ADDRESS,
    paymentValue: "50000000",
    timestamp: 1700000000000,
  });
  const BLOCK_TIMESTAMPS: Record<number, number> = { 100: 1700000000000, 101: 1700001000000 };

  const serveChain = (delegateKey: string | null) => {
    server.use(
      ...rosettaHandlers({
        "/network/status": () => makeNetworkStatusResponse(),
        "/account/balance": () =>
          makeAccountBalanceResponse({ totalBalance: 5_000_000_000, liquidBalance: 4_500_000_000 }),
        "/search/transactions": () => makeTransactionsResponse([OUT_TXN, IN_TXN]),
        "/block": body => {
          const { index } = (body as { block_identifier: { index: number } }).block_identifier;
          return makeBlockInfoResponse(index, { timestamp: BLOCK_TIMESTAMPS[index] });
        },
      }),
      graphqlHandler(body => {
        const { query } = body as { query: string };
        return query.includes("daemonStatus")
          ? makeEpochInfoResponse()
          : makeDelegateAccountResponse(delegateKey);
      }),
      validatorsHandler(() =>
        makeValidatorsPageResponse(
          [makeValidatorFromAPI({ validatorAddress: VALIDATOR_ADDRESS })],
          true,
        ),
      ),
    );
  };

  const shapeInfo = (initialAccount?: MinaAccount) =>
    ({
      address: ADDRESS,
      index: 0,
      derivationPath: "44'/12586'/0'/0/0",
      derivationMode: "minabip44",
      currency: getCryptoCurrencyById("mina"),
      initialAccount,
    }) as unknown as AccountShapeInfo<MinaAccount>;

  const syncConfig = { paginationConfig: {}, blacklistedTokenIds: [] };

  it("builds the account id, balances, block height, operations and staking resources from the node", async () => {
    serveChain(VALIDATOR_ADDRESS);

    const shape = await getAccountShape(shapeInfo(), syncConfig);

    expect(shape).toMatchObject({
      id: `js:2:mina:${ADDRESS}:minabip44`,
      blockHeight: 350000,
      operationsCount: 2,
      resources: {
        blockProducers: [MAPPED_VALIDATOR],
        stakingActive: true,
        delegateInfo: MAPPED_VALIDATOR,
        epochInfo: EPOCH_INFO,
      },
    });
    expect(shape.balance?.toString()).toBe("5000000000");
    expect(shape.spendableBalance?.toString()).toBe("4500000000");
    expect(shape.operations?.map(op => [op.hash, op.type, op.date.getTime()])).toEqual([
      ["txn-out", "OUT", 1700001000000],
      ["txn-in", "IN", 1700000000000],
    ]);
  });

  it("keeps the stored operation references when the same transactions are fetched again", async () => {
    serveChain(VALIDATOR_ADDRESS);
    const first = await getAccountShape(shapeInfo(), syncConfig);

    const second = await getAccountShape(
      shapeInfo({ operations: first.operations, resources: first.resources } as MinaAccount),
      syncConfig,
    );

    expect(second.operations).toHaveLength(2);
    expect(second.operations?.[0]).toBe(first.operations?.[0]);
    expect(second.operations?.[1]).toBe(first.operations?.[1]);
  });

  it("reports staking as inactive and keeps the validators when the account has no delegate", async () => {
    serveChain(null);

    const shape = await getAccountShape(shapeInfo(), syncConfig);

    expect(shape.resources).toEqual({
      blockProducers: [MAPPED_VALIDATOR],
      stakingActive: false,
      delegateInfo: undefined,
      epochInfo: EPOCH_INFO,
    });
  });
});
