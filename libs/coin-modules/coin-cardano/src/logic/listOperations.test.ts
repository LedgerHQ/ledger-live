import type { ListOperationsOptions } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { address as TyphonAddress, types as TyphonTypes } from "@stricahq/typhonjs";
import network from "@ledgerhq/live-network/network";
import { APITransaction, HashType, TransactionCertificates } from "../api/api-types";
import { listOperations } from "./listOperations";

jest.mock("@ledgerhq/live-network/network");

const mockNetwork = network as jest.Mock;

const currency = getCryptoCurrencyById("cardano");

const PAYMENT_HASH = "11".repeat(28);
const STAKE_HASH = "22".repeat(28);
const OTHER_PAYMENT_HASH = "33".repeat(28);
// Realistic 28-byte (56 hex char) policy ids — the canonical Cardano asset-id shape.
const POLICY_ID = "aa".repeat(28);
const POLICY_ID_2 = "bb".repeat(28);
const POOL_KEY_HASH = "a314a18528d00c5fbd067ecb4a212cf2f307c83d2c08f44a11ebebf6";

function bech32BaseAddress(paymentHashHex: string, stakeHashHex: string): string {
  return new TyphonAddress.BaseAddress(
    TyphonTypes.NetworkId.MAINNET,
    { type: TyphonTypes.HashType.ADDRESS, hash: Buffer.from(paymentHashHex, "hex") },
    { type: TyphonTypes.HashType.ADDRESS, hash: Buffer.from(stakeHashHex, "hex") },
  ).getBech32();
}

const ADDRESS = bech32BaseAddress(PAYMENT_HASH, STAKE_HASH);
const COUNTERPARTY_ADDRESS = bech32BaseAddress(OTHER_PAYMENT_HASH, "44".repeat(28));

const emptyCertificate: TransactionCertificates = {
  stakeRegistrations: [],
  stakeDeRegistrations: [],
  stakeDelegations: [],
};

function makeTx(overrides: Partial<APITransaction> = {}): APITransaction {
  return {
    fees: "200000",
    hash: "tx-hash-1",
    timestamp: "2023-06-01T00:00:00.000Z",
    blockHeight: 1000,
    inputs: [],
    outputs: [],
    certificate: { ...emptyCertificate },
    ...overrides,
  };
}

function mockResponse(
  transactions: APITransaction[],
  {
    pageNo = 1,
    limit = 50,
    blockHeight = 0,
    stakeKeyDeposit = "2000000",
  }: Partial<{ pageNo: number; limit: number; blockHeight: number; stakeKeyDeposit: string }> = {},
) {
  mockNetwork.mockImplementation((req: { url?: string }) => {
    if (typeof req?.url === "string" && req.url.includes("/network/info")) {
      return Promise.resolve({ data: { protocolParams: { stakeKeyDeposit } } });
    }
    return Promise.resolve({ data: { transactions, pageNo, limit, blockHeight } });
  });
}

const options: ListOperationsOptions = { limit: 100 } as ListOperationsOptions;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("listOperations", () => {
  describe("early returns without hitting the network", () => {
    it("returns an empty page for an empty address", async () => {
      const page = await listOperations(currency, "", options);

      expect(page).toEqual({ items: [], next: undefined });
      expect(mockNetwork).not.toHaveBeenCalled();
    });

    it("returns an empty page for an unsupported/unparseable address", async () => {
      const page = await listOperations(currency, "not-a-cardano-address", options);

      expect(page).toEqual({ items: [], next: undefined });
      expect(mockNetwork).not.toHaveBeenCalled();
    });
  });

  it("queries the API with the payment key derived from the address", async () => {
    mockResponse([]);

    await listOperations(currency, ADDRESS, options);

    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        data: expect.objectContaining({ paymentKeys: [PAYMENT_HASH], pageNo: 1, blockHeight: 0 }),
      }),
    );
  });

  it("maps an incoming transfer to a native IN operation", async () => {
    mockResponse([
      makeTx({
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: COUNTERPARTY_ADDRESS,
            value: "10000000",
            paymentKey: OTHER_PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [{ address: ADDRESS, value: "5000000", paymentKey: PAYMENT_HASH, tokens: [] }],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "cardano-tx-hash-1",
      type: "IN",
      value: 5000000n,
      senders: [COUNTERPARTY_ADDRESS],
      recipients: [ADDRESS],
      asset: { type: "native" },
    });
    expect(items[0].tx).toMatchObject({
      hash: "tx-hash-1",
      fees: 200000n,
      feesPayer: COUNTERPARTY_ADDRESS,
      failed: false,
    });
  });

  it("maps an outgoing transfer to a native OUT operation with the spent value", async () => {
    mockResponse([
      makeTx({
        fees: "200000",
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: ADDRESS,
            value: "10000000",
            paymentKey: PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [
          {
            address: COUNTERPARTY_ADDRESS,
            value: "7000000",
            paymentKey: OTHER_PAYMENT_HASH,
            tokens: [],
          },
          { address: ADDRESS, value: "2800000", paymentKey: PAYMENT_HASH, tokens: [] },
        ],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    // value EXCLUDES the fee (amount sent = 7_000_000); the generic-coin-framework
    // adapter re-adds tx.fees, so including it here would double-count.
    expect(items[0]).toMatchObject({ type: "OUT", value: 7000000n });
  });

  it("classifies a self-transfer where the only net change is fees as FEES", async () => {
    mockResponse([
      makeTx({
        fees: "200000",
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: ADDRESS,
            value: "3000000",
            paymentKey: PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [{ address: ADDRESS, value: "2800000", paymentKey: PAYMENT_HASH, tokens: [] }],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    // A pure-fee self-transfer carries value 0; the adapter surfaces tx.fees.
    expect(items[0]).toMatchObject({ type: "FEES", value: 0n });
  });

  it("clamps value to 0 (never negative) when an address's net outflow is below the tx fee", async () => {
    // Per-address edge: this address spends less than the whole-tx fee (the rest of
    // the fee is covered by other inputs). value must stay >= 0 — a negative
    // CoinModule value would corrupt the bridge's balance math (it's consumed by the
    // fee-adding adapter with no clamp). The adapter re-adds tx.fees on top.
    mockResponse([
      makeTx({
        fees: "200000",
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: ADDRESS,
            value: "100000",
            paymentKey: PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [
          {
            address: COUNTERPARTY_ADDRESS,
            value: "100000",
            paymentKey: OTHER_PAYMENT_HASH,
            tokens: [],
          },
        ],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    expect(items[0].type).toBe("OUT");
    expect(items[0].value).toBe(0n);
  });

  it("emits a token operation alongside the native one and decodes a printable asset name", async () => {
    const assetNameHex = Buffer.from("MYTOKEN").toString("hex");
    mockResponse([
      makeTx({
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: COUNTERPARTY_ADDRESS,
            value: "10000000",
            paymentKey: OTHER_PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [
          {
            address: ADDRESS,
            value: "5000000",
            paymentKey: PAYMENT_HASH,
            tokens: [{ policyId: POLICY_ID, assetName: assetNameHex, value: "100" }],
          },
        ],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    const tokenOp = items.find(op => op.asset.type === "token");
    expect(tokenOp).toMatchObject({
      id: `cardano-tx-hash-1-${POLICY_ID}${assetNameHex}`,
      type: "IN",
      value: 100n,
      asset: { type: "token", assetReference: `${POLICY_ID}${assetNameHex}`, assetOwner: ADDRESS },
    });
    expect(tokenOp?.details).toMatchObject({ assetNameDecoded: "MYTOKEN" });
  });

  it("skips tokens whose net balance is zero", async () => {
    mockResponse([
      makeTx({
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: ADDRESS,
            value: "3000000",
            paymentKey: PAYMENT_HASH,
            tokens: [{ policyId: POLICY_ID, assetName: "abcd", value: "50" }],
          },
        ],
        outputs: [
          {
            address: ADDRESS,
            value: "2800000",
            paymentKey: PAYMENT_HASH,
            tokens: [{ policyId: POLICY_ID, assetName: "abcd", value: "50" }],
          },
        ],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    expect(items.every(op => op.asset.type === "native")).toBe(true);
  });

  it("emits a token OUT operation when tokens are spent", async () => {
    mockResponse([
      makeTx({
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: ADDRESS,
            value: "3000000",
            paymentKey: PAYMENT_HASH,
            tokens: [{ policyId: POLICY_ID, assetName: "abcd", value: "50" }],
          },
        ],
        outputs: [{ address: ADDRESS, value: "2800000", paymentKey: PAYMENT_HASH, tokens: [] }],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    const tokenOp = items.find(op => op.asset.type === "token");
    expect(tokenOp).toMatchObject({ type: "OUT", value: 50n });
  });

  it("emits one operation per distinct asset moved in a transaction", async () => {
    mockResponse([
      makeTx({
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: COUNTERPARTY_ADDRESS,
            value: "10000000",
            paymentKey: OTHER_PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [
          {
            address: ADDRESS,
            value: "5000000",
            paymentKey: PAYMENT_HASH,
            tokens: [
              { policyId: POLICY_ID, assetName: "a1", value: "10" },
              { policyId: POLICY_ID_2, assetName: "a2", value: "20" },
            ],
          },
        ],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    const tokenOps = items.filter(op => op.asset.type === "token");
    expect(tokenOps).toHaveLength(2);
    expect(tokenOps.map(op => op.value).sort()).toEqual([10n, 20n]);
    expect(items.filter(op => op.asset.type === "native")).toHaveLength(1);
  });

  it("nets the same asset across multiple inputs and outputs into one token operation", async () => {
    mockResponse([
      makeTx({
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: ADDRESS,
            value: "1000000",
            paymentKey: PAYMENT_HASH,
            tokens: [{ policyId: POLICY_ID, assetName: "abcd", value: "20" }],
          },
        ],
        outputs: [
          {
            address: ADDRESS,
            value: "500000",
            paymentKey: PAYMENT_HASH,
            tokens: [{ policyId: POLICY_ID, assetName: "abcd", value: "40" }],
          },
          {
            address: ADDRESS,
            value: "500000",
            paymentKey: PAYMENT_HASH,
            tokens: [{ policyId: POLICY_ID, assetName: "abcd", value: "10" }],
          },
        ],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    const tokenOps = items.filter(op => op.asset.type === "token");
    // net = (40 + 10 received) - (20 spent) = +30
    expect(tokenOps).toHaveLength(1);
    expect(tokenOps[0]).toMatchObject({ type: "IN", value: 30n });
  });

  it("classifies a delegation certificate as DELEGATE and resolves the pool id", async () => {
    mockResponse([
      makeTx({
        certificate: {
          ...emptyCertificate,
          stakeDelegations: [
            {
              index: 0,
              poolKeyHash: POOL_KEY_HASH,
              stakeCredential: { type: HashType.ADDRESS, key: STAKE_HASH },
            },
          ],
        },
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: ADDRESS,
            value: "3000000",
            paymentKey: PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [{ address: ADDRESS, value: "2800000", paymentKey: PAYMENT_HASH, tokens: [] }],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    expect(items[0].type).toBe("DELEGATE");
    expect(items[0].details).toMatchObject({ poolId: expect.stringMatching(/^pool1/) });
    // Outflow whose only cost is the fee → value 0 (adapter re-adds tx.fees).
    expect(items[0].value).toBe(0n);
  });

  it("does not attribute another account's delegation certificate to this operation", async () => {
    const FOREIGN_STAKE_HASH = "99".repeat(28);
    mockResponse([
      makeTx({
        certificate: {
          ...emptyCertificate,
          stakeDelegations: [
            {
              index: 0,
              poolKeyHash: POOL_KEY_HASH,
              stakeCredential: { type: HashType.ADDRESS, key: FOREIGN_STAKE_HASH },
            },
          ],
        },
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: COUNTERPARTY_ADDRESS,
            value: "10000000",
            paymentKey: OTHER_PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [{ address: ADDRESS, value: "5000000", paymentKey: PAYMENT_HASH, tokens: [] }],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    expect(items[0].type).toBe("IN");
    expect(items[0].details).not.toHaveProperty("poolId");
  });

  it("classifies a de-registration as UNDELEGATE and records the refund", async () => {
    mockResponse([
      makeTx({
        certificate: {
          ...emptyCertificate,
          stakeDeRegistrations: [
            { index: 0, stakeCredential: { type: HashType.ADDRESS, key: STAKE_HASH } },
          ],
        },
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: ADDRESS,
            value: "3000000",
            paymentKey: PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [{ address: ADDRESS, value: "4600000", paymentKey: PAYMENT_HASH, tokens: [] }],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    expect(items[0].type).toBe("UNDELEGATE");
    expect(items[0].details).toMatchObject({ refund: "2000000" });
    // magnitude (400_000) minus fee (200_000); adapter re-adds tx.fees.
    expect(items[0].value).toBe(200000n);
  });

  it("does not attribute another account's de-registration to this operation", async () => {
    const FOREIGN_STAKE_HASH = "99".repeat(28);
    mockResponse([
      makeTx({
        certificate: {
          ...emptyCertificate,
          stakeDeRegistrations: [
            { index: 0, stakeCredential: { type: HashType.ADDRESS, key: FOREIGN_STAKE_HASH } },
          ],
        },
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: COUNTERPARTY_ADDRESS,
            value: "10000000",
            paymentKey: OTHER_PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [{ address: ADDRESS, value: "5000000", paymentKey: PAYMENT_HASH, tokens: [] }],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    expect(items[0].type).toBe("IN");
    expect(items[0].details).not.toHaveProperty("refund");
  });

  it("records a stake registration deposit", async () => {
    mockResponse([
      makeTx({
        certificate: {
          ...emptyCertificate,
          stakeRegistrations: [
            { index: 0, stakeCredential: { type: HashType.ADDRESS, key: STAKE_HASH } },
          ],
        },
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: ADDRESS,
            value: "5000000",
            paymentKey: PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [{ address: ADDRESS, value: "2800000", paymentKey: PAYMENT_HASH, tokens: [] }],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    expect(items[0].details).toMatchObject({ deposit: "2000000" });
    // A bare registration (no delegation) is not a staking type: it stays value-based.
    expect(items[0].type).toBe("OUT");
  });

  it("sources the pre-Conway stake deposit from network protocol params, not a hard-coded value", async () => {
    mockResponse(
      [
        makeTx({
          certificate: {
            ...emptyCertificate,
            stakeRegistrations: [
              { index: 0, stakeCredential: { type: HashType.ADDRESS, key: STAKE_HASH } },
            ],
          },
          inputs: [
            {
              txId: "in-0",
              index: 0,
              address: ADDRESS,
              value: "9000000",
              paymentKey: PAYMENT_HASH,
              tokens: [],
            },
          ],
          outputs: [{ address: ADDRESS, value: "2800000", paymentKey: PAYMENT_HASH, tokens: [] }],
        }),
      ],
      { stakeKeyDeposit: "500000" },
    );

    const { items } = await listOperations(currency, ADDRESS, options);

    expect(items[0].details).toMatchObject({ deposit: "500000" });
  });

  it("does not fetch network protocol params for pages without pre-Conway stake certs", async () => {
    mockResponse([
      makeTx({
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: COUNTERPARTY_ADDRESS,
            value: "10000000",
            paymentKey: OTHER_PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [{ address: ADDRESS, value: "5000000", paymentKey: PAYMENT_HASH, tokens: [] }],
      }),
    ]);

    await listOperations(currency, ADDRESS, options);

    const fetchedNetworkInfo = mockNetwork.mock.calls.some(
      ([req]: [{ url?: string }]) =>
        typeof req?.url === "string" && req.url.includes("/network/info"),
    );
    expect(fetchedNetworkInfo).toBe(false);
  });

  it("records reward withdrawals", async () => {
    mockResponse([
      makeTx({
        withdrawals: [
          {
            stakeCredential: { type: HashType.ADDRESS, key: STAKE_HASH },
            stakeHex: "deadbeef",
            amount: "1500000",
          },
        ],
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: ADDRESS,
            value: "3000000",
            paymentKey: PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [{ address: ADDRESS, value: "2800000", paymentKey: PAYMENT_HASH, tokens: [] }],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    expect(items[0].details).toMatchObject({ rewards: "1500000" });
  });

  it("extracts a transaction memo from metadata", async () => {
    mockResponse([
      makeTx({
        metadata: {
          hash: "metadata-hash",
          data: [{ label: "674", value: JSON.stringify({ msg: ["hello", "world"] }) }],
        },
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: COUNTERPARTY_ADDRESS,
            value: "10000000",
            paymentKey: OTHER_PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [{ address: ADDRESS, value: "5000000", paymentKey: PAYMENT_HASH, tokens: [] }],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, options);

    expect(items[0].details).toMatchObject({ memo: "hello, world", metadataHash: "metadata-hash" });
  });

  describe("pagination", () => {
    it("returns the next cursor when the page is full", async () => {
      mockResponse(
        [
          makeTx({
            inputs: [
              {
                txId: "in-0",
                index: 0,
                address: COUNTERPARTY_ADDRESS,
                value: "10000000",
                paymentKey: OTHER_PAYMENT_HASH,
                tokens: [],
              },
            ],
            outputs: [{ address: ADDRESS, value: "5000000", paymentKey: PAYMENT_HASH, tokens: [] }],
          }),
        ],
        { limit: 1 },
      );

      const { next } = await listOperations(currency, ADDRESS, options);

      expect(next).toBe("2");
    });

    it("derives the next cursor from the server-returned page, not the requested one", async () => {
      // Backend clamps the requested page (cursor "999") to page 5; next must
      // follow the page actually served (-> "6"), not the requested one.
      mockResponse(
        [
          makeTx({
            inputs: [
              {
                txId: "in-0",
                index: 0,
                address: COUNTERPARTY_ADDRESS,
                value: "10000000",
                paymentKey: OTHER_PAYMENT_HASH,
                tokens: [],
              },
            ],
            outputs: [{ address: ADDRESS, value: "5000000", paymentKey: PAYMENT_HASH, tokens: [] }],
          }),
        ],
        { limit: 1, pageNo: 5 },
      );

      const { next } = await listOperations(currency, ADDRESS, { ...options, cursor: "999" });

      expect(next).toBe("6");
    });

    it("has no next cursor when the page is not full", async () => {
      mockResponse(
        [
          makeTx({
            inputs: [
              {
                txId: "in-0",
                index: 0,
                address: COUNTERPARTY_ADDRESS,
                value: "10000000",
                paymentKey: OTHER_PAYMENT_HASH,
                tokens: [],
              },
            ],
            outputs: [{ address: ADDRESS, value: "5000000", paymentKey: PAYMENT_HASH, tokens: [] }],
          }),
        ],
        { limit: 50 },
      );

      const { next } = await listOperations(currency, ADDRESS, options);

      expect(next).toBeUndefined();
    });

    it("requests the page indicated by the cursor", async () => {
      mockResponse([], { limit: 50 });

      await listOperations(currency, ADDRESS, { ...options, cursor: "3" });

      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ pageNo: 3 }) }),
      );
    });

    it("falls back to page 1 for an invalid cursor", async () => {
      mockResponse([], { limit: 50 });

      await listOperations(currency, ADDRESS, { ...options, cursor: "not-a-number" });

      expect(mockNetwork).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ pageNo: 1 }) }),
      );
    });

    it("keeps paginating when a full page is entirely filtered out by minHeight", async () => {
      // Full raw page (transactions.length === limit) but every tx is below
      // minHeight, so no operations are produced. Pagination must still advance
      // — hasMore keys off the raw transaction count, not the operation count.
      mockResponse([makeTx({ blockHeight: 1000 })], { limit: 1 });

      const { items, next } = await listOperations(currency, ADDRESS, {
        ...options,
        minHeight: 2000,
      });

      expect(items).toEqual([]);
      expect(next).toBe("2");
    });
  });

  it("filters out transactions below minHeight", async () => {
    mockResponse([makeTx({ blockHeight: 1000 })]);

    const { items } = await listOperations(currency, ADDRESS, { ...options, minHeight: 2000 });

    expect(items).toEqual([]);
  });

  it("orders operations descending (newest first)", async () => {
    mockResponse([
      makeTx({
        hash: "older",
        timestamp: "2023-01-01T00:00:00.000Z",
        inputs: [
          {
            txId: "in-0",
            index: 0,
            address: COUNTERPARTY_ADDRESS,
            value: "10000000",
            paymentKey: OTHER_PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [{ address: ADDRESS, value: "5000000", paymentKey: PAYMENT_HASH, tokens: [] }],
      }),
      makeTx({
        hash: "newer",
        timestamp: "2023-12-31T00:00:00.000Z",
        inputs: [
          {
            txId: "in-1",
            index: 0,
            address: COUNTERPARTY_ADDRESS,
            value: "10000000",
            paymentKey: OTHER_PAYMENT_HASH,
            tokens: [],
          },
        ],
        outputs: [{ address: ADDRESS, value: "5000000", paymentKey: PAYMENT_HASH, tokens: [] }],
      }),
    ]);

    const { items } = await listOperations(currency, ADDRESS, { ...options, order: "desc" });

    expect(items[0].id).toBe("cardano-newer");
    expect(items[1].id).toBe("cardano-older");
  });

  it("rejects ascending order (cannot be honored across pages on a newest-first backend)", async () => {
    await expect(listOperations(currency, ADDRESS, { ...options, order: "asc" })).rejects.toThrow(
      "ascending order is not supported",
    );
  });
});
