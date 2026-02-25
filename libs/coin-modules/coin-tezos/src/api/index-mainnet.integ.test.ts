import { localForger } from "@taquito/local-forging";
import { OpKind } from "@taquito/rpc";
import { TezosConfig } from "../config";
import api from "../network/tzkt";
import type { TezosApi } from "./types";
import { createApi } from ".";

/**
 * Unrevealed mainnet account (see tzkt explorer).
 *
 * If this account is revealed, tests will fail and will need to be updated with a new one.
 * New unreveal account if necessary
 * Hash: tz1Y7xGN7jVjTTjaz6fpAeCMLiEENRkzHk4i
 * Public Key: edpkuidtssPLLHKZCo9uKDGy4nnXKeBn1Kv5h4DdWZ3d8G5tcUBy4B
 */
const UNREVEALED_SENDER = "tz2RZHPmNVQY7h1oopsvDBMrp8i48zhc9cAL";
const UNREVEALED_PUBLIC_KEY = "0268eae382350b43ba1af0e1140e4b68dc9d2084836494554860c1be0605a7af2d";

const defaultConfig: TezosConfig = {
  baker: {
    url: "https://baker.example.com",
  },
  explorer: {
    url: "https://xtz-tzkt-explorer.api.vault.ledger.com",
    maxTxQuery: 100,
  },
  node: {
    url: "https://xtz-node.api.vault.ledger.com",
  },
  fees: {
    minGasLimit: 600,
    minRevealGasLimit: 300,
    minStorageLimit: 0,
    minFees: 500,
    minEstimatedFees: 500,
  },
};

/** Decoded operation. */
type DecodedOperation = {
  kind: number;
  fee?: string;
  gas_limit?: string;
  storage_limit?: string;
  delegate?: string;
  source?: string;
};

/**
 * Mainnet-specific integration tests
 * Please implement your tests in testnet-specific tests file (see index.integ.test.ts)
 * Use this test suite in last resort
 */
describe("Tezos Api - Mainnet", () => {
  let module: TezosApi;

  beforeAll(() => {
    module = createApi(defaultConfig);
  });

  describe("estimateFees", () => {
    it("fallback to an estimation without the public key", async () => {
      // When
      const result = await module.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: "tz2BHzkaizWwCmhYswwTQCycgT8mXFH8QTL5",
        senderPublicKey: "038ad002bc17d427794e148c9b9b464e977dc3cbc4d76148e97641ae86e46ec176",
        recipient: "tz2JpHaYBjGdTq7b5mWFpG9AP3L3CckdRJcA",
        amount: BigInt(100),
      });

      expect(result.value).toBeGreaterThanOrEqual(BigInt(0));
      expect(result.parameters?.gasLimit).toBeGreaterThanOrEqual(BigInt(0));
      expect(result.parameters?.storageLimit).toBeGreaterThanOrEqual(BigInt(0));
    });
  });

  describe("encode", () => {
    it("encode a reveal operation without failing", async () => {
      // When
      const result = await module.craftTransaction(
        {
          intentType: "transaction",
          asset: { type: "native" },
          type: "send",
          sender: "tz2F4XnSd1wjwWsthemvZQjoPER7NVSt35k3",
          senderPublicKey: "03576c19462a7d0cc3d121b1b00e92258b5f71d643c99a599fc1683f03abb7a1c2",
          recipient: "tz2TLTEWhG87pPKK7MxYLavitGGwje1znRwQ",
          amount: BigInt(500000),
        },
        { value: BigInt(832) },
      );

      expect(result).toEqual({ transaction: expect.stringMatching(/^([A-Fa-f0-9]{2})+$/) });
    });

    it("includes a properly estimated reveal operation when delegating from an unrevealed account with senderPublicKey", async () => {
      const sender = UNREVEALED_SENDER;
      const account = await api.getAccountByAddress(sender);
      expect(account).toMatchObject({
        type: "user",
        revealed: false,
      });

      const delegate = "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D";
      const intent = {
        intentType: "transaction" as const,
        asset: { type: "native" as const },
        type: "delegate" as const,
        sender,
        senderPublicKey: UNREVEALED_PUBLIC_KEY,
        recipient: delegate,
        amount: BigInt(0),
      };

      const { transaction: encodedTransaction } = await module.craftTransaction(intent);
      const decoded = await localForger.parse(encodedTransaction.slice(2)); // strip 03 prefix

      expect(decoded.contents.length).toBe(2);

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const reveal = decoded.contents[0] as DecodedOperation;
      expect(reveal.kind).toBe(OpKind.REVEAL);
      expect(BigInt(reveal.fee ?? "0")).toBeGreaterThanOrEqual(500);
      expect(Number(reveal.gas_limit ?? "0")).toBeGreaterThanOrEqual(300);
      expect(Number(reveal.storage_limit ?? "0")).toBeGreaterThanOrEqual(0);
      expect(reveal.source).toEqual(sender);

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const delegation = decoded.contents[1] as DecodedOperation;
      expect(delegation.kind).toBe(OpKind.DELEGATION);
      expect(BigInt(delegation.fee ?? "0")).toBeGreaterThanOrEqual(500);
      expect(Number(delegation.gas_limit ?? "0")).toBeGreaterThanOrEqual(10000);
      expect(Number(delegation.storage_limit ?? "0")).toBeGreaterThanOrEqual(0);
      expect(delegation.delegate).toEqual(delegate);
      expect(delegation.source).toEqual(sender);

      const total = decoded.contents.reduce((sum, op) => sum + BigInt(op.fee ?? "0"), 0n);
      expect(total).toBeGreaterThanOrEqual(1000n);
    });
  });

  describe("with custom fees settings", () => {
    let moduleCustomFees: TezosApi;

    beforeAll(() => {
      moduleCustomFees = createApi({
        ...defaultConfig,
        fees: {
          minGasLimit: 600,
          minRevealGasLimit: 300,
          minStorageLimit: 0,
          minFees: 1200,
          minEstimatedFees: 1100,
        },
      });
    });

    describe("estimateFees", () => {
      it("respects minFees on a composite transaction", async () => {
        const result = await moduleCustomFees.estimateFees({
          intentType: "transaction",
          asset: { type: "native" },
          type: "delegate",
          sender: UNREVEALED_SENDER,
          senderPublicKey: UNREVEALED_PUBLIC_KEY,
          recipient: "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D",
          amount: BigInt(0),
        });

        // minFees should be used for both operations, so total should be minFees * 2
        expect(result.value).toBe(2400n);
      });

      describe("craftTransaction", () => {
        it("respects customFee on a composite transaction if greater than default estimation", async () => {
          const { transaction: encodedTransaction } = await moduleCustomFees.craftTransaction(
            {
              intentType: "transaction",
              asset: { type: "native" },
              type: "delegate",
              sender: UNREVEALED_SENDER,
              senderPublicKey: UNREVEALED_PUBLIC_KEY,
              recipient: "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D",
              amount: BigInt(0),
            },
            { value: 3000n },
          );
          const decoded = await localForger.parse(encodedTransaction.slice(2));

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const reveal = decoded.contents[0] as DecodedOperation;
          expect(reveal.kind).toBe(OpKind.REVEAL);
          expect(BigInt(reveal.fee ?? "0")).toEqual(1200n);

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const delegation = decoded.contents[1] as DecodedOperation;
          expect(delegation.kind).toBe(OpKind.DELEGATION);
          expect(BigInt(delegation.fee ?? "0")).toBeGreaterThanOrEqual(1800n);

          // The provided customFee exceeds the default estimation. In this case, we expect the fee to be increased on
          // the main operation (delegate) so that total fee paid respects customFee.
          const totalFees = decoded.contents.reduce((sum, op) => sum + BigInt(op.fee ?? "0"), 0n);
          expect(totalFees).toBe(3000n);
        });

        it("respects customFee on a composite transaction if lesser than default estimation", async () => {
          const { transaction: encodedTransaction } = await moduleCustomFees.craftTransaction(
            {
              intentType: "transaction",
              asset: { type: "native" },
              type: "delegate",
              sender: "tz1Y7xGN7jVjTTjaz6fpAeCMLiEENRkzHk4i",
              senderPublicKey: "edpkuidtssPLLHKZCo9uKDGy4nnXKeBn1Kv5h4DdWZ3d8G5tcUBy4B",
              recipient: "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D",
              amount: BigInt(0),
            },
            { value: 2000n },
          );
          const decoded = await localForger.parse(encodedTransaction.slice(2));

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const reveal = decoded.contents[0] as DecodedOperation;
          expect(reveal.kind).toBe(OpKind.REVEAL);
          expect(BigInt(reveal.fee ?? "0")).toEqual(1200n);

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const delegation = decoded.contents[1] as DecodedOperation;
          expect(delegation.kind).toBe(OpKind.DELEGATION);
          expect(BigInt(delegation.fee ?? "0")).toBeGreaterThanOrEqual(800n);

          // The provided customFee is less than the default estimation. In this case, we expect the fee to be decreased
          // on the main operation (delegate) so that total fee paid respects customFee. Transaction could fail, but
          // that's caller responsibility.
          const totalFees = decoded.contents.reduce((sum, op) => sum + BigInt(op.fee ?? "0"), 0n);
          expect(totalFees).toBe(2000n);
        });
      });
    });
  });
});
