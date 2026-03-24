import type { RosettaTransaction } from "../api/types";
import { getTransactions } from "../logic/history/getTransactions";
import {
  makeTransactionsResponse,
  makeRosettaTransaction,
  makeBlockInfoResponse,
} from "../test/helpers/msw-fixtures";
import { server, rosettaHandlers } from "../test/helpers/msw-rosetta.mock";
import { mapRosettaTxnToOperation } from "./synchronisation";

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

  it("should map a delegate_change transaction to a REDELEGATE operation", async () => {
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
    expect(ops[0].type).toBe("REDELEGATE");
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
