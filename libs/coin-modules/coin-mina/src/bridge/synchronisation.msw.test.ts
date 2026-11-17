import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import BigNumber from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import { getTransactions } from "../logic/history/getTransactions";
import { fetchValidators } from "../network";
import type { RosettaTransaction } from "../network/types";
import type { MinaAccount, MinaSigner } from "../types";
import {
  makeAccountBalanceResponse,
  makeDelegateAccountResponse,
  makeEpochInfoResponse,
  makeNetworkStatusResponse,
  makeRosettaTransaction,
  makeTransactionsResponse,
  makeValidatorsPageResponse,
  makeValidatorFromAPI,
  makeBlockInfoResponse,
} from "../test/helpers/msw-fixtures";
import {
  graphqlHandler,
  rosettaHandlers,
  server,
  validatorsHandler,
} from "../test/helpers/msw-rosetta.mock";
import { buildAccountBridge, buildCurrencyBridge } from "./index";
import { mapRosettaTxnToOperation } from "./synchronisation";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  fetchValidators.reset();
});
afterAll(() => server.close());

const ACCOUNT_ID = "js:2:mina:B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD:";
const ADDRESS = "B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD";
const OTHER_ADDRESS = "B62qkWcHhoisWDCR7v3gvWzX6wXEVuGYLHXq3mSym4GEzfYXmSDv314";
const CURRENCY = getCryptoCurrencyById("mina");
const SYNC_CONFIG = { paginationConfig: {} };

const delegateTransaction = (): RosettaTransaction => ({
  block_identifier: { index: 200, hash: "block-200" },
  transaction: {
    transaction_identifier: { hash: "delegate-txn-001" },
    operations: [
      {
        operation_identifier: { index: 0 },
        type: "fee_payment",
        status: "Success",
        account: { address: ADDRESS, metadata: { token_id: "MINA" } },
        amount: { value: "-10000000", currency: { symbol: "MINA", decimals: 9 } },
      },
      {
        operation_identifier: { index: 1 },
        type: "delegate_change",
        status: "Success",
        account: { address: ADDRESS, metadata: { token_id: "MINA" } },
        metadata: { delegate_change_target: OTHER_ADDRESS },
      },
    ],
  },
  timestamp: 1700000000000,
});

const useSyncHandlers = (transactions: RosettaTransaction[] = [delegateTransaction()]) => {
  server.use(
    ...rosettaHandlers({
      "/network/status": () => makeNetworkStatusResponse(),
      "/account/balance": body => {
        const address = (body as { account_identifier: { address: string } }).account_identifier
          .address;
        return address === ADDRESS
          ? makeAccountBalanceResponse({
              totalBalance: 5_000_000_000,
              liquidBalance: 4_500_000_000,
            })
          : makeAccountBalanceResponse({ totalBalance: 0, liquidBalance: 0 });
      },
      "/search/transactions": body => {
        const address = (body as { account_identifier: { address: string } }).account_identifier
          .address;
        return makeTransactionsResponse(address === ADDRESS ? transactions : []);
      },
      "/block": body =>
        makeBlockInfoResponse(
          (body as { block_identifier: { index: number } }).block_identifier.index,
        ),
    }),
    graphqlHandler(body =>
      String((body as { query?: string }).query).includes("GetDelegateAccount")
        ? makeDelegateAccountResponse(OTHER_ADDRESS)
        : makeEpochInfoResponse(),
    ),
    validatorsHandler(() =>
      makeValidatorsPageResponse([makeValidatorFromAPI({ validatorAddress: OTHER_ADDRESS })], true),
    ),
  );
};

const makeSignerContext = (): SignerContext<MinaSigner> =>
  (async (_deviceId, callback) =>
    callback({
      getAddress: async account => ({
        publicKey: account === 0 ? ADDRESS : OTHER_ADDRESS,
        returnCode: "0x9000",
      }),
      signTransaction: jest.fn(),
    })) as SignerContext<MinaSigner>;

const makeAccount = (): MinaAccount =>
  ({
    id: ACCOUNT_ID,
    type: "Account",
    seedIdentifier: ADDRESS,
    derivationMode: "minabip44",
    index: 0,
    freshAddress: ADDRESS,
    freshAddressPath: "44'/12586'/0'/0/0",
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(0),
    blockHeight: 0,
    currency: CURRENCY,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(0),
    subAccounts: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
  }) as MinaAccount;

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
    const ops = await mapRosettaTxnToOperation(ACCOUNT_ID, ADDRESS, delegateTransaction());

    expect(ops).toHaveLength(1);
    expect(ops[0].type).toBe("DELEGATE");
    expect(ops[0].value.toNumber()).toBe(0);
    expect(ops[0].fee.toNumber()).toBe(10000000);
  });

  it("should fall back to getBlockInfo when timestamp is nullish", async () => {
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

describe("Mina stake synchronization via MSW", () => {
  it("should synchronize stake data and a delegate operation", async () => {
    useSyncHandlers();
    const account = makeAccount();
    const sync = buildAccountBridge(makeSignerContext()).sync;

    const updater = await lastValueFrom(sync(account, SYNC_CONFIG));
    const synced = updater(account);

    expect(synced.balance.toNumber()).toBe(5_000_000_000);
    expect(synced.spendableBalance.toNumber()).toBe(4_500_000_000);
    expect(synced.operations).toEqual([
      expect.objectContaining({
        type: "DELEGATE",
        recipients: [OTHER_ADDRESS],
      }),
    ]);
    expect(synced.resources).toEqual(
      expect.objectContaining({
        stakingActive: true,
        delegateInfo: expect.objectContaining({ address: OTHER_ADDRESS }),
        epochInfo: expect.objectContaining({ epoch: "42" }),
      }),
    );
  });

  it("should scan a staked account through the currency bridge", async () => {
    useSyncHandlers();
    const scanAccounts = buildCurrencyBridge(makeSignerContext()).scanAccounts;

    const events = await lastValueFrom(
      scanAccounts({
        currency: CURRENCY,
        deviceId: "device-id",
        syncConfig: SYNC_CONFIG,
        scheme: "minabip44",
      }).pipe(toArray()),
    );

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "discovered",
          account: expect.objectContaining({
            freshAddress: ADDRESS,
            used: true,
            resources: expect.objectContaining({ stakingActive: true }),
          }),
        }),
      ]),
    );
  });
});

describe("getTransactions and mapRosettaTxnToOperation integration via MSW", () => {
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

    expect(ops.map(op => op.type)).toEqual(expect.arrayContaining(["OUT", "IN"]));
  });
});
