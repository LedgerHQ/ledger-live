import type {
  StakingTransactionIntent,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { types as TyphonTypes } from "@stricahq/typhonjs";
import BigNumber from "bignumber.js";
import { APITransaction } from "../api/api-types";
import { getAllTransactionsByKeys } from "../api/fetchTransactions";
import { getDelegationInfo } from "../api/getDelegationInfo";
import { fetchNetworkInfo } from "../api/getNetworkInfo";
import { getProtocolParamsFixture } from "../fixtures/protocolParams";
import { extractPaymentKeyFromAddress } from "../utils";
import { buildUnsignedTransaction, craftTransaction } from "./craftTransaction";

jest.mock("../api/fetchTransactions");
jest.mock("../api/getDelegationInfo");
jest.mock("../api/getNetworkInfo");

const mockFetchTxs = jest.mocked(getAllTransactionsByKeys);
const mockGetDelegation = jest.mocked(getDelegationInfo);
const mockFetchNetworkInfo = jest.mocked(fetchNetworkInfo);

// getAllTransactionsByKeys returns the paginated result shape; craftTransaction only reads the
// transaction list, so wrap a plain list with a dummy blockHeight in the tests.
const paged = (transactions: APITransaction[]) => ({ transactions, blockHeight: 1 });

const currency = getCryptoCurrencyById("cardano");
// Real mainnet base addresses; Typhon parses them for real.
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

function stakeIntent(
  over: Partial<StakingTransactionIntent> = {},
): StakingTransactionIntent<StringMemo> {
  return {
    intentType: "staking",
    type: "delegate",
    sender: SENDER,
    recipient: SENDER,
    amount: 0n,
    asset: { type: "native" },
    mode: "delegate",
    valAddress: POOL_HASH,
    ...over,
  } as StakingTransactionIntent<StringMemo>;
}

const registeredDelegation = (over: Record<string, unknown> = {}) => ({
  status: true,
  deposit: "2000000",
  poolId: "pool1old",
  dRepHex: undefined,
  ticker: undefined,
  name: undefined,
  rewards: new BigNumber(0),
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchNetworkInfo.mockResolvedValue({ protocolParams: getProtocolParamsFixture() });
  mockGetDelegation.mockResolvedValue(undefined);
  mockFetchTxs.mockResolvedValue(paged([makeTx({ hash: "a", outputs: [output("10000000")] })]));
});

describe("craftTransaction", () => {
  it("serializes the unsigned tx to a hex payload and reports the resolved fee", async () => {
    const { transaction, details } = await craftTransaction(currency, sendIntent());

    expect(transaction).toMatch(/^[0-9a-f]+$/);
    expect(new BigNumber(details?.fees as string).gt(0)).toBe(true);
  });
});

describe("buildUnsignedTransaction — native ADA", () => {
  it("adds a recipient output and lets Typhon return change to the sender", async () => {
    const tx = await buildUnsignedTransaction(currency, sendIntent());

    expect(mockFetchTxs).toHaveBeenCalledWith([PAYMENT_KEY], 0, currency);
    expect(tx.getInputs()).toHaveLength(1);
    expect(tx.getOutputs()).toHaveLength(2); // recipient + change
    expect(tx.getFee().gt(0)).toBe(true);
  });

  it("sends the whole balance to the recipient (no change output) when useAllAmount is set", async () => {
    const tx = await buildUnsignedTransaction(currency, sendIntent({ useAllAmount: true }));

    expect(tx.getOutputs()).toHaveLength(1); // recipient is the sole sink
  });

  it("sweeps every UTXO to the recipient on send-all (not just the first selected)", async () => {
    // Typhon does minimal coin selection over the available inputs; a sweep must override that
    // and spend the whole UTXO set, or the recipient silently receives less than the balance.
    mockFetchTxs.mockResolvedValue(
      paged([
        makeTx({ hash: "a", outputs: [output("10000000")] }),
        makeTx({ hash: "b", outputs: [output("5000000")] }),
        makeTx({ hash: "c", outputs: [output("7000000")] }),
      ]),
    );

    const tx = await buildUnsignedTransaction(currency, sendIntent({ useAllAmount: true }));

    expect(tx.getInputs()).toHaveLength(3); // every UTXO consumed
    const recipientOut = tx.getOutputs()[0];
    // recipient receives the full 22 ADA balance minus the fee
    expect(recipientOut.amount.toFixed()).toBe(
      new BigNumber(22_000_000).minus(tx.getFee()).toFixed(),
    );
  });

  it("keeps the sender's tokens on a send-all instead of transferring them to the recipient", async () => {
    mockFetchTxs.mockResolvedValue(
      paged([
        makeTx({
          hash: "a",
          outputs: [output("10000000", [{ policyId: POLICY_ID, assetName: "abcd", value: "100" }])],
        }),
      ]),
    );

    const tx = await buildUnsignedTransaction(currency, sendIntent({ useAllAmount: true }));

    const tokenOutputs = tx.getOutputs().filter(o => o.tokens.length > 0);
    expect(tokenOutputs).toHaveLength(1);
    // The token stays with the sender; the recipient only receives ADA.
    expect((tokenOutputs[0].address as TyphonTypes.ShelleyAddress).getBech32()).toBe(SENDER);
    const recipientOutput = tx
      .getOutputs()
      .find(o => (o.address as TyphonTypes.ShelleyAddress).getBech32() === RECIPIENT);
    expect(recipientOutput?.tokens).toEqual([]);
  });

  it("rejects a non-positive amount", async () => {
    await expect(buildUnsignedTransaction(currency, sendIntent({ amount: 0n }))).rejects.toThrow(
      "Transaction amount must be positive",
    );
  });

  it("rejects an amount below the per-output min-ADA floor", async () => {
    await expect(buildUnsignedTransaction(currency, sendIntent({ amount: 1n }))).rejects.toThrow(
      "Transaction amount is below the minimum required for an output",
    );
  });

  it("rejects a sender address with no payment credential without hitting the network", async () => {
    await expect(
      buildUnsignedTransaction(currency, sendIntent({ sender: "not-an-address" })),
    ).rejects.toThrow("Unsupported sender address");
    expect(mockFetchTxs).not.toHaveBeenCalled();
  });

  it("rejects when the sender has no spendable UTXOs", async () => {
    mockFetchTxs.mockResolvedValue(paged([]));

    await expect(buildUnsignedTransaction(currency, sendIntent())).rejects.toThrow(
      "No spendable UTXOs for sender address",
    );
  });
});

describe("buildUnsignedTransaction — token", () => {
  it("builds a multiasset output carrying the requested token to the recipient", async () => {
    mockFetchTxs.mockResolvedValue(
      paged([
        makeTx({
          hash: "a",
          outputs: [output("10000000", [{ policyId: POLICY_ID, assetName: "abcd", value: "100" }])],
        }),
      ]),
    );

    const tx = await buildUnsignedTransaction(
      currency,
      // Canonical Cardano asset id: policyId (56 hex) concatenated with the asset name, no
      // separator — the same identifier getBalance/listOperations emit.
      sendIntent({ amount: 100n, asset: { type: "token", assetReference: `${POLICY_ID}abcd` } }),
    );

    const recipientOutput = tx.getOutputs()[0];
    expect(recipientOutput.tokens).toEqual([
      { policyId: POLICY_ID, assetName: "abcd", amount: new BigNumber(100) },
    ]);
  });

  it("sends the full held token balance on useAllAmount (summed across UTXOs)", async () => {
    mockFetchTxs.mockResolvedValue(
      paged([
        makeTx({
          hash: "a",
          outputs: [output("10000000", [{ policyId: POLICY_ID, assetName: "abcd", value: "70" }])],
        }),
        makeTx({
          hash: "b",
          outputs: [output("10000000", [{ policyId: POLICY_ID, assetName: "abcd", value: "30" }])],
        }),
      ]),
    );

    const tx = await buildUnsignedTransaction(
      currency,
      sendIntent({
        useAllAmount: true,
        amount: 0n,
        asset: { type: "token", assetReference: `${POLICY_ID}abcd` },
      }),
    );

    const recipientOutput = tx.getOutputs()[0];
    expect(recipientOutput.tokens).toEqual([
      { policyId: POLICY_ID, assetName: "abcd", amount: new BigNumber(100) }, // 70 + 30
    ]);
  });

  it("rejects a token send-all when the sender holds none of that token", async () => {
    mockFetchTxs.mockResolvedValue(paged([makeTx({ hash: "a", outputs: [output("10000000")] })]));

    await expect(
      buildUnsignedTransaction(
        currency,
        sendIntent({
          useAllAmount: true,
          amount: 0n,
          asset: { type: "token", assetReference: `${POLICY_ID}abcd` },
        }),
      ),
    ).rejects.toThrow("Sender holds none of the requested token");
  });

  it("accepts a reference with an empty asset name (policy id only)", async () => {
    mockFetchTxs.mockResolvedValue(
      paged([
        makeTx({
          hash: "a",
          outputs: [output("10000000", [{ policyId: POLICY_ID, assetName: "", value: "100" }])],
        }),
      ]),
    );

    const tx = await buildUnsignedTransaction(
      currency,
      sendIntent({ amount: 100n, asset: { type: "token", assetReference: POLICY_ID } }),
    );

    expect(tx.getOutputs()[0].tokens).toEqual([
      { policyId: POLICY_ID, assetName: "", amount: new BigNumber(100) },
    ]);
  });

  it.each([
    ["missing reference", { type: "token" }],
    ["too short to hold a policy id", { type: "token", assetReference: "abcd" }],
    ["non-hex policy id", { type: "token", assetReference: `${"z".repeat(56)}abcd` }],
    ["non-hex asset name", { type: "token", assetReference: `${POLICY_ID}zz` }],
    ["odd-length asset name", { type: "token", assetReference: `${POLICY_ID}abc` }],
    [
      "asset name over 32 bytes",
      { type: "token", assetReference: `${POLICY_ID}${"a".repeat(66)}` },
    ],
  ])("rejects an invalid token asset reference (%s)", async (_label, asset) => {
    await expect(
      buildUnsignedTransaction(currency, sendIntent({ amount: 100n, asset })),
    ).rejects.toThrow("Invalid token asset reference");
  });
});

describe("buildUnsignedTransaction — staking", () => {
  it("registers and delegates when the stake key is not yet registered", async () => {
    const tx = await buildUnsignedTransaction(currency, stakeIntent());

    const certs = tx.getCertificates();
    expect(certs.map(c => c.type)).toEqual([
      TyphonTypes.CertificateType.STAKE_KEY_REGISTRATION,
      TyphonTypes.CertificateType.STAKE_DELEGATION,
    ]);
  });

  it("only delegates when the stake key is already registered", async () => {
    mockGetDelegation.mockResolvedValue(registeredDelegation());

    const tx = await buildUnsignedTransaction(currency, stakeIntent());

    expect(tx.getCertificates().map(c => c.type)).toEqual([
      TyphonTypes.CertificateType.STAKE_DELEGATION,
    ]);
  });

  it("de-registers the stake key on undelegate", async () => {
    mockGetDelegation.mockResolvedValue(registeredDelegation());

    const tx = await buildUnsignedTransaction(
      currency,
      stakeIntent({ type: "undelegate", mode: "undelegate" }),
    );

    expect(tx.getCertificates().map(c => c.type)).toEqual([
      TyphonTypes.CertificateType.STAKE_KEY_DE_REGISTRATION,
    ]);
  });

  it("rejects undelegate when the stake key is not registered", async () => {
    await expect(
      buildUnsignedTransaction(currency, stakeIntent({ type: "undelegate", mode: "undelegate" })),
    ).rejects.toThrow("Stake key is not registered");
  });

  it("rejects an unsupported staking mode", async () => {
    await expect(
      buildUnsignedTransaction(
        currency,
        stakeIntent({ type: "redelegate", mode: "redelegate" } as never),
      ),
    ).rejects.toThrow("Unsupported staking mode");
  });

  it("rejects delegation without a pool id", async () => {
    await expect(
      buildUnsignedTransaction(currency, stakeIntent({ valAddress: "" })),
    ).rejects.toThrow("Missing pool id for delegation");
  });
});

describe("buildUnsignedTransaction — account obligations (Conway)", () => {
  it("sweeps claimable rewards via a withdrawal when delegated to a dRep", async () => {
    mockGetDelegation.mockResolvedValue(
      registeredDelegation({ dRepHex: "drep1abc", rewards: new BigNumber("1500000") }),
    );

    const tx = await buildUnsignedTransaction(currency, sendIntent());

    expect(tx.getWithdrawals()).toHaveLength(1);
    expect(tx.getWithdrawals()[0].amount).toEqual(new BigNumber("1500000"));
  });

  it("adds an ABSTAIN vote certificate when rewards exist but no dRep is set", async () => {
    mockGetDelegation.mockResolvedValue(
      registeredDelegation({ dRepHex: undefined, rewards: new BigNumber("1500000") }),
    );

    const tx = await buildUnsignedTransaction(currency, sendIntent());

    expect(tx.getWithdrawals()).toHaveLength(0);
    expect(tx.getCertificates().map(c => c.type)).toEqual([
      TyphonTypes.CertificateType.VOTE_DELEGATION,
    ]);
  });
});

describe("buildUnsignedTransaction — custom fees", () => {
  it("overrides the estimated fee and absorbs the difference into the change output", async () => {
    const estimated = await buildUnsignedTransaction(currency, sendIntent());
    const estimatedChange = estimated.getOutputs()[1].amount;
    const customFee = estimated.getFee().plus(50_000);

    const tx = await buildUnsignedTransaction(currency, sendIntent(), {
      value: BigInt(customFee.toFixed()),
    });

    expect(tx.getFee()).toEqual(customFee);
    // The extra 50,000 lovelace of fee comes straight out of the change output.
    expect(tx.getOutputs()[1].amount).toEqual(estimatedChange.minus(50_000));
  });

  it("rejects a custom fee below the protocol minimum (Typhon's estimate)", async () => {
    await expect(buildUnsignedTransaction(currency, sendIntent(), { value: 1n })).rejects.toThrow(
      "Custom fee is below the minimum required fee",
    );
  });

  it("rejects a custom fee that would push the change below the min-UTXO amount", async () => {
    await expect(
      buildUnsignedTransaction(currency, sendIntent(), { value: 9_999_000_000n }),
    ).rejects.toThrow("Custom fee too high");
  });
});
