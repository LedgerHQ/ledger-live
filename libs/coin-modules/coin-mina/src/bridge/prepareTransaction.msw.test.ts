import BigNumber from "bignumber.js";
import { createMockAccount, createMockTransaction } from "../test/fixtures";
import { makeMetadataResponse, makePreprocessResponse } from "../test/helpers/msw-fixtures";
import { rosettaHandlers, server } from "../test/helpers/msw-rosetta.mock";
import estimateMaxSpendable from "./estimateMaxSpendable";
import getTransactionStatus from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const SENDER = "B62qiVhtBtqakq8sNTHdCTXn6tETSK6gtsmNHRn1WdLqjGLpsHbw1xc";
const RECIPIENT = "B62qr5cXFjdnZXYxP5dEwRY7wENxcod4Q2oLxUDiq1QrBXZZyxMH8q4";
const FEE = "10000000";

const account = createMockAccount({
  balance: new BigNumber(5_000_000_000),
  spendableBalance: new BigNumber(5_000_000_000),
});

const serveMetadata = () =>
  server.use(
    ...rosettaHandlers({
      "/construction/preprocess": () => makePreprocessResponse(SENDER, RECIPIENT),
      "/construction/metadata": () =>
        makeMetadataResponse({ nonce: "42", feeValue: FEE, sender: SENDER, receiver: RECIPIENT }),
    }),
  );

const unpreparedTransaction = (overrides = {}) =>
  createMockTransaction({
    amount: new BigNumber(2_000_000_000),
    fees: { fee: new BigNumber(0), accountCreationFee: new BigNumber(0) },
    nonce: 0,
    ...overrides,
  });

describe("prepareTransaction via MSW", () => {
  it("loads the fee and the nonce from the node so that the status has no error", async () => {
    serveMetadata();
    const unprepared = unpreparedTransaction();

    const statusBefore = await getTransactionStatus(account, unprepared);
    const prepared = await prepareTransaction(account, unprepared);
    const statusAfter = await getTransactionStatus(account, prepared);

    expect(statusBefore.errors.fees?.name).toEqual("FeeNotLoaded");
    expect(prepared.fees).toEqual({
      fee: new BigNumber(FEE),
      accountCreationFee: new BigNumber(0),
    });
    expect(prepared.nonce).toEqual(42);
    expect(statusAfter.errors).toEqual({});
    expect(statusAfter.totalSpent).toEqual(new BigNumber(2_010_000_000));
  });

  it("resolves useAllAmount to the same amount in the preparation, the estimation and the status", async () => {
    serveMetadata();
    const unprepared = unpreparedTransaction({ useAllAmount: true });

    const prepared = await prepareTransaction(account, unprepared);
    const status = await getTransactionStatus(account, prepared);
    const estimated = await estimateMaxSpendable({ account, transaction: prepared });

    expect(estimated).toEqual(new BigNumber(4_990_000_000));
    expect(prepared.amount).toEqual(estimated);
    expect(status.amount).toEqual(estimated);
    expect(status.errors).toEqual({});
  });
});
