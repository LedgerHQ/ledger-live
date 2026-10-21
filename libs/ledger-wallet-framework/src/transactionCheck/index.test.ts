jest.mock("@ledgerhq/live-network/network", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("@ledgerhq/live-config/LiveConfig");

import { createHash } from "crypto";
import network from "@ledgerhq/live-network/network";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { TransactionCheckPayload } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "../types";
import {
  checkTransaction,
  getTransactionCheckConfig,
  parseDescriptor,
  TransactionCheckRisk,
} from ".";

const mockedNetwork = jest.mocked(network);
const mockedLiveConfig = jest.mocked(LiveConfig);

const URL = "https://transaction-checks.test.invalid/v3";
const CONFIG = { url: URL, chainId: 1000 };
const FROM = "bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu";

const hashOf = (raw: string) => createHash("sha256").update(raw).digest("hex");

const makePayload = (raw: string): TransactionCheckPayload => ({
  chain: "bitcoin",
  from: FROM,
  raw,
  txHash: hashOf(raw),
});

function tlv(tag: number, value: Buffer): Buffer {
  const tagBytes = tag < 0x80 ? Buffer.from([tag]) : Buffer.from([0x81, tag]);
  return Buffer.concat([tagBytes, Buffer.from([value.length]), value]);
}

function makeDescriptor({
  txHash,
  from = FROM,
  chainId = 1000,
  risk,
}: {
  txHash: string;
  from?: string;
  chainId?: number;
  risk: number;
}): string {
  const chain = Buffer.alloc(8);
  chain.writeBigUInt64BE(BigInt(chainId));
  return (
    "0x" +
    Buffer.concat([
      tlv(0x01, Buffer.from([0x09])),
      tlv(0x02, Buffer.from([0x00, 0x01])),
      tlv(0x23, chain),
      tlv(0x22, Buffer.from(from, "ascii")),
      tlv(0x27, Buffer.from(txHash, "hex")),
      tlv(0x80, Buffer.from([risk])),
      tlv(0x81, Buffer.from([risk === 0 ? 0x00 : 0x02])),
      tlv(0x83, Buffer.from("https://bl.kd/abc", "ascii")),
      tlv(0x84, Buffer.from([0x00])),
      tlv(0x15, Buffer.alloc(70, 0x30)),
    ]).toString("hex")
  );
}

const respondWith = (risk: (payload: { from: string; raw: string }) => number) =>
  mockedNetwork.mockImplementation(async ({ data }) => {
    const { tx } = data as { tx: { from: string; raw: string } };
    return {
      data: {
        public_key_id: "blockaid",
        descriptor: makeDescriptor({ txHash: hashOf(tx.raw), from: tx.from, risk: risk(tx) }),
        block: 1,
      },
      status: 200,
    } as Awaited<ReturnType<typeof network>>;
  });

describe("getTransactionCheckConfig", () => {
  const currency = { id: "bitcoin" } as CryptoCurrency;

  beforeEach(() => mockedLiveConfig.getValueByKey.mockReset());

  it("reads the url and chain id of the currency config", () => {
    mockedLiveConfig.getValueByKey.mockReturnValue({ transactionChecks: CONFIG });

    expect(getTransactionCheckConfig(currency)).toEqual(CONFIG);
    expect(mockedLiveConfig.getValueByKey).toHaveBeenCalledWith("config_currency_bitcoin");
  });

  it.each([
    undefined,
    {},
    { transactionChecks: {} },
    { transactionChecks: { url: "", chainId: 1000 } },
    { transactionChecks: { url: URL } },
    { transactionChecks: { chainId: 1000 } },
  ])("is off when the currency config misses the url or chain id (%j)", config => {
    mockedLiveConfig.getValueByKey.mockReturnValue(config);

    expect(getTransactionCheckConfig(currency)).toBeUndefined();
  });
});

describe("parseDescriptor", () => {
  const payload = { ...makePayload("cHNidP8B"), chainId: 1000 };

  it("extracts the risk of a descriptor matching the transaction", () => {
    const descriptor = makeDescriptor({
      txHash: payload.txHash,
      risk: TransactionCheckRisk.Threat,
    });

    expect(parseDescriptor(descriptor, payload)).toEqual({
      risk: TransactionCheckRisk.Threat,
      category: 0x02,
      providerMessage: undefined,
      reportUrl: "https://bl.kd/abc",
    });
  });

  it("rejects a descriptor computed for another transaction", () => {
    const descriptor = makeDescriptor({ txHash: hashOf("other"), risk: 2 });

    expect(() => parseDescriptor(descriptor, payload)).toThrow("descriptor TX_HASH mismatch");
  });

  it("rejects a descriptor computed for another chain", () => {
    const descriptor = makeDescriptor({ txHash: payload.txHash, chainId: 1001, risk: 2 });

    expect(() => parseDescriptor(descriptor, payload)).toThrow("descriptor CHAIN_ID mismatch");
  });

  it("rejects a descriptor for another address", () => {
    const descriptor = makeDescriptor({ txHash: payload.txHash, from: "bc1qother", risk: 2 });

    expect(() => parseDescriptor(descriptor, payload)).toThrow("descriptor ADDRESS mismatch");
  });
});

describe("checkTransaction", () => {
  beforeEach(() => mockedNetwork.mockReset());

  it("posts the transaction to the chain endpoint and returns the risk", async () => {
    respondWith(() => TransactionCheckRisk.Risk);
    const payload = makePayload("posts");

    const result = await checkTransaction(CONFIG, payload);

    expect(result?.risk).toBe(TransactionCheckRisk.Risk);
    expect(mockedNetwork).toHaveBeenCalledWith({
      method: "POST",
      url: `${URL}/bitcoin/scan/tx`,
      headers: { "X-Ledger-Client-Origin": expect.any(String) },
      data: { tx: { from: FROM, raw: "posts" }, chain: 1000 },
    });
  });

  it("accepts a base url with a trailing slash", async () => {
    respondWith(() => TransactionCheckRisk.Benign);

    await checkTransaction({ ...CONFIG, url: `${URL}/` }, makePayload("trailing slash"));

    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ url: `${URL}/bitcoin/scan/tx` }),
    );
  });

  it("serves the same transaction from the cache and scans another one", async () => {
    respondWith(({ raw }) =>
      raw === "flagged" ? TransactionCheckRisk.Threat : TransactionCheckRisk.Benign,
    );

    const first = await checkTransaction(CONFIG, makePayload("flagged"));
    const again = await checkTransaction(CONFIG, makePayload("flagged"));
    const other = await checkTransaction(CONFIG, makePayload("clean"));

    expect(first?.risk).toBe(TransactionCheckRisk.Threat);
    expect(again?.risk).toBe(TransactionCheckRisk.Threat);
    expect(other?.risk).toBe(TransactionCheckRisk.Benign);
    expect(mockedNetwork).toHaveBeenCalledTimes(2);
  });

  it("returns null when the backend fails", async () => {
    mockedNetwork.mockRejectedValue(new Error("422"));

    await expect(checkTransaction(CONFIG, makePayload("fails"))).resolves.toBeNull();
  });

  it("returns null when the descriptor does not answer for the transaction", async () => {
    mockedNetwork.mockResolvedValue({
      data: { descriptor: makeDescriptor({ txHash: hashOf("other"), risk: 2 }) },
      status: 200,
    } as Awaited<ReturnType<typeof network>>);

    await expect(checkTransaction(CONFIG, makePayload("mismatch"))).resolves.toBeNull();
  });
});
