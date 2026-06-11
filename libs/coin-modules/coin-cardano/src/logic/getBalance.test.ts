import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import BigNumber from "bignumber.js";
import { APITransaction } from "../api/api-types";
import { getAllTransactionsByKeys } from "../api/fetchTransactions";
import { getDelegationInfo } from "../api/getDelegationInfo";
import { fetchNetworkInfo } from "../api/getNetworkInfo";
import { extractPaymentKeyFromAddress } from "../utils";
import { getBalance } from "./getBalance";

jest.mock("../api/fetchTransactions");
jest.mock("../api/getDelegationInfo");
jest.mock("../api/getNetworkInfo");

const mockFetchTxs = jest.mocked(getAllTransactionsByKeys);
const mockGetDelegation = jest.mocked(getDelegationInfo);
const mockFetchNetworkInfo = jest.mocked(fetchNetworkInfo);

// getAllTransactionsByKeys returns the paginated result shape; getBalance only reads the
// transaction list, so wrap a plain list with a dummy blockHeight in the tests.
const paged = (transactions: APITransaction[]) => ({ transactions, blockHeight: 1 });

const currency = getCryptoCurrencyById("cardano");
// Real mainnet base address; extraction (Typhon) runs for real against it.
const ADDRESS =
  "addr1q8mgw8geggkl2hs0m6rq3pgt69uxttpqcgu6euxje5tt6plxjtjrnskhhtt03g6l3sr98p9t8mtlajr26vmwjzep77pqxn8cms";
const PAYMENT_KEY = extractPaymentKeyFromAddress(ADDRESS);
const OTHER_KEY = "ff".repeat(28);

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

function output(
  paymentKey: string,
  value: string,
  tokens: APITransaction["outputs"][number]["tokens"] = [],
) {
  return { address: ADDRESS, value, paymentKey, tokens };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetDelegation.mockResolvedValue(undefined);
});

describe("getBalance", () => {
  it("returns the native UTXO sum for the address's payment key", async () => {
    mockFetchTxs.mockResolvedValue(
      paged([
        makeTx({ hash: "a", outputs: [output(PAYMENT_KEY, "5000000"), output(OTHER_KEY, "9999")] }),
      ]),
    );

    const [native] = await getBalance(currency, ADDRESS);

    expect(mockFetchTxs).toHaveBeenCalledWith([PAYMENT_KEY], 0, currency);
    expect(native).toEqual({ value: 5000000n, asset: { type: "native", name: "ADA" }, locked: 0n });
  });

  it("excludes outputs later spent as inputs", async () => {
    mockFetchTxs.mockResolvedValue(
      paged([
        makeTx({ hash: "a", outputs: [output(PAYMENT_KEY, "5000000")] }),
        makeTx({
          hash: "b",
          inputs: [
            {
              txId: "a",
              index: 0,
              address: ADDRESS,
              value: "5000000",
              paymentKey: PAYMENT_KEY,
              tokens: [],
            },
          ],
          outputs: [output(PAYMENT_KEY, "3000000")],
        }),
      ]),
    );

    const [native] = await getBalance(currency, ADDRESS);

    expect(native.value).toBe(3000000n);
  });

  it("returns a token balance per held asset", async () => {
    mockFetchNetworkInfo.mockResolvedValue({
      protocolParams: { utxoCostPerByte: "4310" },
    } as never);
    mockFetchTxs.mockResolvedValue(
      paged([
        makeTx({
          hash: "a",
          outputs: [
            output(PAYMENT_KEY, "5000000", [{ policyId: "pol1", assetName: "abcd", value: "100" }]),
          ],
        }),
      ]),
    );

    const balances = await getBalance(currency, ADDRESS);
    const token = balances.find(b => b.asset.type === "token");

    expect(token).toMatchObject({
      value: 100n,
      asset: { type: "token", assetReference: "pol1abcd", assetOwner: ADDRESS },
    });
    // Min-ADA backing the token is locked (non-spendable).
    const native = balances[0];
    expect(native.locked).toBeGreaterThan(0n);
  });

  it("maps a delegation to a separate stake balance (deposit + rewards)", async () => {
    mockFetchTxs.mockResolvedValue(
      paged([makeTx({ hash: "a", outputs: [output(PAYMENT_KEY, "5000000")] })]),
    );
    mockGetDelegation.mockResolvedValue({
      status: true,
      deposit: "2000000",
      poolId: "pool1abc",
      ticker: "LDG",
      name: "Ledger",
      dRepHex: undefined,
      rewards: new BigNumber("1500000"),
    });

    const balances = await getBalance(currency, ADDRESS);
    const stakeBalance = balances.find(b => b.stake !== undefined);

    expect(balances[0].value).toBe(6500000n); // utxo 5,000,000 + rewards 1,500,000
    expect(balances[0].locked).toBe(1500000n); // rewards not spendable (no dRep)
    expect(stakeBalance).toMatchObject({
      value: 3500000n,
      asset: { type: "native", name: "ADA" },
      stake: {
        uid: expect.any(String),
        delegate: "pool1abc",
        state: "active",
        amount: 3500000n,
        amountDeposited: 2000000n,
        amountRewarded: 1500000n,
        // Delegated (poolId set): delegate (change pool) + undelegate (deregister). No claim_reward —
        // Cardano stakes never expose a standalone claim action (shared with getStakes).
        actions: ["delegate", "undelegate"],
        details: { ticker: "LDG", name: "Ledger" },
      },
    });
  });

  it("unlocks rewards once delegated to a dRep", async () => {
    mockFetchTxs.mockResolvedValue(
      paged([makeTx({ hash: "a", outputs: [output(PAYMENT_KEY, "5000000")] })]),
    );
    mockGetDelegation.mockResolvedValue({
      status: true,
      deposit: "2000000",
      poolId: "pool1abc",
      ticker: "LDG",
      name: "Ledger",
      dRepHex: "drep1abc",
      rewards: new BigNumber("1500000"),
    });

    const balances = await getBalance(currency, ADDRESS);
    const stakeBalance = balances.find(b => b.stake !== undefined);

    expect(balances[0].locked).toBe(0n); // rewards spendable when delegated to a dRep
    // dRep doesn't add a claim action — Cardano rewards are withdrawn implicitly within a tx.
    expect(stakeBalance?.stake?.actions).toEqual(["delegate", "undelegate"]);
    expect(stakeBalance?.stake?.details).toMatchObject({ dRepHex: "drep1abc" });
  });

  it("omits the stake balance when there is no staking position", async () => {
    mockFetchTxs.mockResolvedValue(
      paged([makeTx({ hash: "a", outputs: [output(PAYMENT_KEY, "5000000")] })]),
    );
    mockGetDelegation.mockResolvedValue(undefined);

    const balances = await getBalance(currency, ADDRESS);

    expect(balances.some(b => b.stake !== undefined)).toBe(false);
  });

  it("returns a zero native balance for an unparseable address without hitting the network", async () => {
    const balances = await getBalance(currency, "not-a-cardano-address");

    expect(mockFetchTxs).not.toHaveBeenCalled();
    expect(balances).toEqual([{ value: 0n, asset: { type: "native", name: "ADA" }, locked: 0n }]);
  });

  it("rejects Byron addresses instead of misreporting a zero balance", async () => {
    // Byron addresses are valid but carry no Shelley payment credential, so their UTXOs
    // cannot be derived — returning 0 would silently hide funds that may exist.
    await expect(
      getBalance(currency, "Ae2tdPwUPEZFBgKrLT9pn8JPJVbefcL4kuznpQxQpxKfTVuHJ9gLAmxKk4w"),
    ).rejects.toThrow("Byron addresses are not supported");
    expect(mockFetchTxs).not.toHaveBeenCalled();
  });

  it("propagates fetch errors", async () => {
    mockFetchTxs.mockRejectedValue(new Error("network down"));

    await expect(getBalance(currency, ADDRESS)).rejects.toThrow("network down");
  });
});
