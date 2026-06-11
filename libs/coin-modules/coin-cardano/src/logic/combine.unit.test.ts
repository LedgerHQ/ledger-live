import type { StringMemo, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import * as cbors from "@stricahq/cbors";
import { crypto } from "@stricahq/typhonjs";
import { getAllTransactionsByKeys } from "../api/fetchTransactions";
import { getDelegationInfo } from "../api/getDelegationInfo";
import { fetchNetworkInfo } from "../api/getNetworkInfo";
import { getProtocolParamsFixture } from "../fixtures/protocolParams";
import { extractPaymentKeyFromAddress } from "../utils";
import { combine } from "./combine";
import { buildUnsignedTransaction } from "./craftTransaction";

jest.mock("../api/fetchTransactions");
jest.mock("../api/getDelegationInfo");
jest.mock("../api/getNetworkInfo");

const mockFetchTxs = jest.mocked(getAllTransactionsByKeys);
const mockGetDelegation = jest.mocked(getDelegationInfo);
const mockFetchNetworkInfo = jest.mocked(fetchNetworkInfo);

const currency = getCryptoCurrencyById("cardano");
const SENDER =
  "addr1q8mgw8geggkl2hs0m6rq3pgt69uxttpqcgu6euxje5tt6plxjtjrnskhhtt03g6l3sr98p9t8mtlajr26vmwjzep77pqxn8cms";
const RECIPIENT =
  "addr1qxqm3nxwzf70ke9jqa2zrtrevjznpv6yykptxnv34perjc8a7zgxmpv5pgk4hhhe0m9kfnlsf5pt7d2ahkxaul2zygrq3nura9";
const PAYMENT_KEY = extractPaymentKeyFromAddress(SENDER);

// Stand-ins for a device witness: a 32-byte ed25519 public key and 64-byte signature.
const PUBKEY = "cd".repeat(32);
const SIGNATURE = "ab".repeat(64);
const VKEY_WITNESS_SET_KEY = 0;
const POLICY_ID = "a".repeat(56);
const POOL_HASH = "b".repeat(56);

/**
 * Assert that combining a signature onto the crafted unsigned tx leaves the body bytes
 * (hence its hash — what the device signed) unchanged through the cbors decode/re-encode.
 */
async function expectBodyPreserved(intent: TransactionIntent<StringMemo>): Promise<void> {
  const tx = await buildUnsignedTransaction(currency, intent);
  const { payload, hash } = tx.buildTransaction();
  const { value } = cbors.Decoder.decode(Buffer.from(combine(payload, SIGNATURE, PUBKEY), "hex"));
  expect(crypto.hash32(cbors.Encoder.encode(value[0])).toString("hex")).toBe(hash);
}

function sendIntent(): TransactionIntent<StringMemo> {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 2_000_000n,
    asset: { type: "native" },
  } as TransactionIntent<StringMemo>;
}

/** Build a realistic unsigned tx and return its CBOR payload + canonical body hash. */
async function craftUnsigned(): Promise<{ payload: string; bodyHash: string }> {
  const tx = await buildUnsignedTransaction(currency, sendIntent());
  const { payload, hash } = tx.buildTransaction();
  return { payload, bodyHash: hash };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchNetworkInfo.mockResolvedValue({ protocolParams: getProtocolParamsFixture() });
  mockGetDelegation.mockResolvedValue(undefined);
  mockFetchTxs.mockResolvedValue({
    transactions: [
      {
        fees: "0",
        hash: "a",
        timestamp: "1700000000",
        blockHeight: 1,
        inputs: [],
        certificate: { stakeRegistrations: [], stakeDeRegistrations: [], stakeDelegations: [] },
        outputs: [{ address: SENDER, value: "10000000", paymentKey: PAYMENT_KEY, tokens: [] }],
      },
    ],
    blockHeight: 1,
  });
});

describe("combine", () => {
  it("injects the vkey witness into the unsigned transaction's witness set", async () => {
    const { payload } = await craftUnsigned();

    const signedHex = combine(payload, SIGNATURE, PUBKEY);

    const { value } = cbors.Decoder.decode(Buffer.from(signedHex, "hex"));
    const witnessSet = value[1] as Map<number, [Buffer, Buffer][]>;
    const vkeyWitnesses = witnessSet.get(VKEY_WITNESS_SET_KEY);

    expect(vkeyWitnesses).toHaveLength(1);
    expect(vkeyWitnesses?.[0][0].toString("hex")).toBe(PUBKEY);
    expect(vkeyWitnesses?.[0][1].toString("hex")).toBe(SIGNATURE);
  });

  it("appends to existing witnesses when combining onto a partially-signed transaction", async () => {
    const { payload } = await craftUnsigned();
    const PUBKEY_2 = "ef".repeat(32);
    const SIGNATURE_2 = "12".repeat(64);

    // Combine onto an already-combined (partially-signed) payload — the first witness must survive.
    const onceSigned = combine(payload, SIGNATURE, PUBKEY);
    const twiceSigned = combine(onceSigned, SIGNATURE_2, PUBKEY_2);

    const { value } = cbors.Decoder.decode(Buffer.from(twiceSigned, "hex"));
    const witnessSet = value[1] as Map<number, [Buffer, Buffer][]>;
    const vkeyWitnesses = witnessSet.get(VKEY_WITNESS_SET_KEY);

    expect(vkeyWitnesses).toHaveLength(2);
    expect(vkeyWitnesses?.[0][0].toString("hex")).toBe(PUBKEY); // original witness preserved
    expect(vkeyWitnesses?.[0][1].toString("hex")).toBe(SIGNATURE);
    expect(vkeyWitnesses?.[1][0].toString("hex")).toBe(PUBKEY_2); // new one appended
    expect(vkeyWitnesses?.[1][1].toString("hex")).toBe(SIGNATURE_2);
  });

  it("preserves the transaction body so the signed hash still matches what was signed", async () => {
    const { payload, bodyHash } = await craftUnsigned();

    const signedHex = combine(payload, SIGNATURE, PUBKEY);

    const { value } = cbors.Decoder.decode(Buffer.from(signedHex, "hex"));
    const reencodedBodyHash = crypto.hash32(cbors.Encoder.encode(value[0])).toString("hex");
    expect(reencodedBodyHash).toBe(bodyHash);
    expect(value[2]).toBe(true); // is_valid is untouched
  });

  // The body hash is what the device signs, so cbors decode→re-encode must be byte-faithful for
  // every transaction shape, not just a bare native send — token multiasset maps, staking
  // certificates and memo auxiliary-data all add structure to the body.
  it("preserves the body for a token transfer", async () => {
    mockFetchTxs.mockResolvedValue({
      transactions: [
        {
          fees: "0",
          hash: "a",
          timestamp: "1700000000",
          blockHeight: 1,
          inputs: [],
          certificate: { stakeRegistrations: [], stakeDeRegistrations: [], stakeDelegations: [] },
          outputs: [
            {
              address: SENDER,
              value: "10000000",
              paymentKey: PAYMENT_KEY,
              tokens: [{ policyId: POLICY_ID, assetName: "abcd", value: "100" }],
            },
          ],
        },
      ],
      blockHeight: 1,
    });

    await expectBodyPreserved({
      ...sendIntent(),
      amount: 100n,
      asset: { type: "token", assetReference: `${POLICY_ID}abcd` },
    } as TransactionIntent<StringMemo>);
  });

  it("preserves the body for a staking delegation (certificates)", async () => {
    await expectBodyPreserved({
      intentType: "staking",
      type: "delegate",
      sender: SENDER,
      recipient: SENDER,
      amount: 0n,
      asset: { type: "native" },
      mode: "delegate",
      valAddress: POOL_HASH,
    } as TransactionIntent<StringMemo>);
  });

  it("preserves the body for a send with a memo (auxiliary data)", async () => {
    await expectBodyPreserved({
      ...sendIntent(),
      memo: { type: "string", value: "gm" },
    } as TransactionIntent<StringMemo>);
  });

  // The signature/public-key cases never reach tx decoding (validation runs
  // first), so a dummy "00" tx suffices; the tx cases pass a valid SIGNATURE/PUBKEY.
  // 0x82 is a CBOR array header announcing two items, with none following.
  it.each<[string, string, string, string | undefined, string]>([
    ["the public key is missing", "00", SIGNATURE, undefined, "requires the signing public key"],
    ["the signature length is wrong", "00", "ab".repeat(32), PUBKEY, "invalid signature length"],
    [
      "the public key length is wrong",
      "00",
      SIGNATURE,
      "cd".repeat(16),
      "invalid public key length",
    ],
    ["the signature is not hex", "00", "zz".repeat(64), PUBKEY, "signature is not valid hex"],
    ["the transaction is not hex", "nothex", SIGNATURE, PUBKEY, "transaction is not valid hex"],
    ["the transaction is not CBOR", "82", SIGNATURE, PUBKEY, "not valid CBOR"],
    [
      "the transaction is not a 4-element array",
      cbors.Encoder.encode([1, 2]).toString("hex"),
      SIGNATURE,
      PUBKEY,
      "expected a 4-element CBOR array",
    ],
    [
      "the witness set is not a map",
      cbors.Encoder.encode([new Map(), [], true, null]).toString("hex"),
      SIGNATURE,
      PUBKEY,
      "witness set is not a CBOR map",
    ],
    [
      "the vkey witnesses are not an array",
      cbors.Encoder.encode([new Map(), new Map([[0, "not-an-array"]]), true, null]).toString("hex"),
      SIGNATURE,
      PUBKEY,
      "vkey witnesses is not a CBOR array",
    ],
  ])("rejects when %s", (_label, tx, signature, pubkey, expected) => {
    expect(() => combine(tx, signature, pubkey)).toThrow(expected);
  });
});
