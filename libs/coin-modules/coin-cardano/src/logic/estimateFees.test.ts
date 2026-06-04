import type {
  StakingTransactionIntent,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { APITransaction } from "../api/api-types";
import { getAllTransactionsByKeys } from "../api/fetchTransactions";
import { getDelegationInfo } from "../api/getDelegationInfo";
import { fetchNetworkInfo } from "../api/getNetworkInfo";
import { getProtocolParamsFixture } from "../fixtures/protocolParams";
import { extractPaymentKeyFromAddress } from "../utils";
import { craftTransaction } from "./craftTransaction";
import { estimateFees } from "./estimateFees";

jest.mock("../api/fetchTransactions");
jest.mock("../api/getDelegationInfo");
jest.mock("../api/getNetworkInfo");

const mockFetchTxs = jest.mocked(getAllTransactionsByKeys);
const mockGetDelegation = jest.mocked(getDelegationInfo);
const mockFetchNetworkInfo = jest.mocked(fetchNetworkInfo);

// getAllTransactionsByKeys returns the paginated result shape; the fee build only reads the
// transaction list, so wrap a plain list with a dummy blockHeight in the tests.
const paged = (transactions: APITransaction[]) => ({ transactions, blockHeight: 1 });

const currency = getCryptoCurrencyById("cardano");
const SENDER =
  "addr1q8mgw8geggkl2hs0m6rq3pgt69uxttpqcgu6euxje5tt6plxjtjrnskhhtt03g6l3sr98p9t8mtlajr26vmwjzep77pqxn8cms";
const RECIPIENT =
  "addr1qxqm3nxwzf70ke9jqa2zrtrevjznpv6yykptxnv34perjc8a7zgxmpv5pgk4hhhe0m9kfnlsf5pt7d2ahkxaul2zygrq3nura9";
const PAYMENT_KEY = extractPaymentKeyFromAddress(SENDER);
const POLICY_ID = "a".repeat(56);
const POOL_HASH = "b".repeat(56);

function makeTx(partial: Partial<APITransaction>): APITransaction {
  return {
    fees: "0",
    hash: "tx-hash",
    timestamp: "1700000000",
    blockHeight: 1,
    inputs: [],
    outputs: [],
    certificate: { stakeRegistrations: [], stakeDeRegistrations: [], stakeDelegations: [] },
    ...partial,
  };
}

function output(value: string, tokens: APITransaction["outputs"][number]["tokens"] = []) {
  return { address: SENDER, value, paymentKey: PAYMENT_KEY, tokens };
}

function sendIntent(over: Partial<TransactionIntent> = {}): TransactionIntent<StringMemo> {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 2_000_000n,
    asset: { type: "native" },
    ...over,
  } as TransactionIntent<StringMemo>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchNetworkInfo.mockResolvedValue({ protocolParams: getProtocolParamsFixture() });
  mockGetDelegation.mockResolvedValue(undefined);
  mockFetchTxs.mockResolvedValue(paged([makeTx({ hash: "a", outputs: [output("10000000")] })]));
});

describe("estimateFees", () => {
  it("returns the fee Typhon computes for a native send", async () => {
    const { value } = await estimateFees(currency, sendIntent());

    expect(typeof value).toBe("bigint");
    expect(value).toBeGreaterThan(0n);
  });

  it("computes the exact deterministic fee for a fixed native send", async () => {
    // Pins the lovelace fee for a stable mocked tx so a fee regression that affects the shared
    // build path (not just estimate-vs-craft parity) is caught.
    const { value } = await estimateFees(currency, sendIntent());

    expect(value).toBe(166865n);
  });

  it("estimates a token transfer (size-based, same behaviour as a native send)", async () => {
    mockFetchTxs.mockResolvedValue(
      paged([
        makeTx({
          hash: "a",
          outputs: [output("10000000", [{ policyId: POLICY_ID, assetName: "abcd", value: "100" }])],
        }),
      ]),
    );

    const { value } = await estimateFees(
      currency,
      sendIntent({ amount: 100n, asset: { type: "token", assetReference: `${POLICY_ID}abcd` } }),
    );

    expect(value).toBeGreaterThan(0n);
  });

  it("estimates a staking delegation", async () => {
    const intent = {
      intentType: "staking",
      type: "delegate",
      sender: SENDER,
      recipient: SENDER,
      amount: 0n,
      asset: { type: "native" },
      mode: "delegate",
      valAddress: POOL_HASH,
    } as StakingTransactionIntent<StringMemo>;

    const { value } = await estimateFees(currency, intent);

    expect(value).toBeGreaterThan(0n);
  });

  it("matches the fee craftTransaction reports for the same intent (no custom fee)", async () => {
    const intent = sendIntent();

    const { value } = await estimateFees(currency, intent);
    const crafted = await craftTransaction(currency, intent);

    expect(value.toString()).toBe(crafted.details?.fees);
  });

  it("propagates errors when the transaction cannot be built", async () => {
    mockFetchTxs.mockResolvedValue(paged([]));

    await expect(estimateFees(currency, sendIntent())).rejects.toThrow(
      "No spendable UTXOs for sender address",
    );
  });
});
