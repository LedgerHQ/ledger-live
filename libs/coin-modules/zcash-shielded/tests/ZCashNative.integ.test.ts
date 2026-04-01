/**
 * Integration tests for ZCashNative against the real Zcash testnet gRPC endpoint.
 * Run only locally: pnpm test-integ
 * Not run in CI (pnpm test ignores *.integ.test.ts).
 */
import BigNumber from "bignumber.js";
import { firstValueFrom } from "rxjs";
import { ZCashNative } from "../src/ZCash";
import { ZCASH_GRPC_URL_TESTNET } from "../src/constants";
import type { ShieldedSyncResult } from "../src/ZCash";
import type { ShieldedTransaction } from "../src/types";

// Alice's testnet UFVK — public test key, never use with real funds.
// Seed: "wish puppy smile loan doll curve hole maze file ginger hair nose key relax knife witness cannon grab despair throw review deal slush frame"
const ALICE_UFVK =
  "uviewtest1eacc7lytmvgp0sshwjjv4qsg9fnewq00s6zye8hqwndpdsg0tum2ft4k96t86eapddpq56exfycnxnlds75vvpydv8fgj4cecczkmt3rjat8qjfqrk2cdlm9alep2z04785sx6yekqjk6wywkttlthld4c3xmg8fvneg4p97vzxwu9xtuh0xrgfy90p6uuxf8cwl8nxfq6hlte0nnylk59xceldrkx9vge3k4utkue2txu5kpp60aw07q0f0jgp0pv2c0gr7jdm6273uxyskt72jehte5jf2dg94d84le08h2t5rhd93j2d98ja59h46est69f3a7rav7k6744p2u8dxasc7nr9p2k95x7uaknahj0kw7mu5zq9nllj7x2qswq3jswsuzwms7shv7dhxz9s4yudatwu3u3v3wqznkhu6jt7xt8whjh3dkzvsf28p6mj8tya009gwzgszz2at8alquu8y0fmqt7klayrjx7n3ulml5q00fgdr";

// Birth height of Alice's account (first known tx at block 2,546,396).
// 200k-block chunk covers all three transaction types below (~3s at 72k bl/s).
const ALICE_BIRTH_HEIGHT = 2_542_419;

// ── Known Alice transactions (observed 2026-04-06, testnet.zec.rocks) ─────────
//
// Transfer types (for shielded notes):
//   "internal"  — note received into Alice's own shielded pool (shielding/change)
//   "incoming"  — note sent from another party to Alice
//   "outgoing"  — note sent by Alice to another shielded address (encrypted with OVK)
//
// Special case — z→t unshielding (TX_Z_TO_T):
//   Produces NO shielded output notes → invisible to syncShielded trial decryption.
//   Confirmed on-chain at height 2,546,324: valueBalanceSapling > 0, 0 t-inputs,
//   1 transparent output. Observable only via transparent address lookup.

/** shielded-to-transparent (z→t unshielding)
 *  valueBalanceSapling > 0 + 0 transparent inputs + 1 transparent output.
 *  The preceding tx to Alice's shielding: funds leave the shielded pool directly
 *  to transparent address tmCxJG72RWN66xwPtNgu4iKHpyysGrc7rEg (Alice's t-address).
 *  INVISIBLE to trial decryption: no shielded output notes produced → absent from
 *  syncShielded results regardless of which viewing key is used. */
const TX_Z_TO_T = {
  txid: "36c4681ac80293ea0b575267154df33950fb31d359344e8d2009664d1eef2cd5",
  blockHeight: 2_546_324,
};

/** transparent-to-shielded (t→z shielding)
 *  Fee = 0: the miner fee comes from the transparent side; shielded value balances net to 0. */
const TX_SHIELDING = {
  txid: "474d547a8a258b25b3b1a7ef8843820bacabfc5440210ffb0dd709be1d67acb1",
  blockHeight: 2_546_396,
  fee: new BigNumber(0),
  saplingNotes: [
    {
      amount: new BigNumber(15_768_768),
      transfer_type: "internal",
      memo: "shielding:",
    },
  ],
};

/** shielded-to-shielded incoming (z→z, Alice is the recipient)
 *  Fee > 0: deducted from the Sapling/Orchard value balance. */
const TX_INCOMING = {
  txid: "534325eb022d8936ca2645681997e7f14ae8665ea392f3ccbcdbe391a614d158",
  blockHeight: 2_560_774,
  fee: new BigNumber(10_000),
  saplingNotes: [{ amount: new BigNumber(50_000), transfer_type: "incoming", memo: "test H" }],
};

/** shielded-to-shielded outgoing (z→z, Alice is the sender)
 *  Outgoing note encrypted with Alice's OVK (the value she sent away).
 *  Internal note = change returned to Alice's own shielded pool.
 *  Fee > 0: deducted from the Sapling value balance. */
const TX_OUTGOING = {
  txid: "79adebf53156ba47cb7a220f45f34b78007880685710c079de72f86432c9de2c",
  blockHeight: 2_700_549,
  fee: new BigNumber(10_000),
  saplingNotes: [
    { amount: new BigNumber(10_000), transfer_type: "outgoing", memo: "Pending values" },
    { amount: new BigNumber(1_790_960), transfer_type: "internal", memo: "" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

describe("ZCashNative integration (real gRPC)", () => {
  describe("getChainTip", () => {
    it("should return a realistic chain tip (> 3,000,000)", async () => {
      const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
      const tip = await engine.getChainTip();
      expect(typeof tip).toBe("number");
      expect(Number.isInteger(tip)).toBe(true);
      expect(tip).toBeGreaterThan(3_000_000);
    });
  });

  describe("syncShielded — empty range", () => {
    it("should emit one result with no transactions when already at tip", async () => {
      const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
      const tip = await engine.getChainTip();

      const steps: ShieldedSyncResult[] = [];
      await engine
        .syncShielded({ startBlockHeight: tip + 1000, viewingKey: ALICE_UFVK, maxBatchSize: 1000 })
        .forEach(s => steps.push(s));

      expect(steps).toHaveLength(1);
      expect(steps[0].transactions).toHaveLength(0);
      expect(steps[0].remainingBlocks).toBe(0);
    });
  });

  describe("syncShielded — Alice's known transactions", () => {
    // Single gRPC call: blocks [2,542,419 → 2,742,418] (200k blocks, ~3s).
    // Covers four transaction types: z→t unshielding (invisible), t→z shielding,
    // z→z incoming, and z→z outgoing.
    let txMap: Map<string, ShieldedTransaction>;

    beforeAll(async () => {
      const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_TESTNET });
      const result = await firstValueFrom(
        engine.syncShielded({
          startBlockHeight: ALICE_BIRTH_HEIGHT,
          viewingKey: ALICE_UFVK,
          maxBatchSize: 200_000,
        }),
      );
      txMap = new Map(result.transactions.map(tx => [tx.id, tx]));
    });

    it("should find all three shielded transactions but NOT the z→t unshielding", () => {
      expect(txMap.has(TX_Z_TO_T.txid)).toBe(false); // z→t: no shielded outputs → invisible
      expect(txMap.has(TX_SHIELDING.txid)).toBe(true);
      expect(txMap.has(TX_INCOMING.txid)).toBe(true);
      expect(txMap.has(TX_OUTGOING.txid)).toBe(true);
    });

    // ── t→z shielding ──────────────────────────────────────────────────────

    describe("transparent-to-shielded (shielding) — fee = 0, transfer_type = internal", () => {
      it("should have the correct block height", () => {
        expect(txMap.get(TX_SHIELDING.txid)!.blockHeight).toBe(TX_SHIELDING.blockHeight);
      });

      it("should have fee = 0 (miner fee paid from the transparent side)", () => {
        const tx = txMap.get(TX_SHIELDING.txid)!;
        expect(tx.fee).toBeInstanceOf(BigNumber);
        expect(tx.fee).toEqual(new BigNumber(0));
      });

      it("should have one Sapling internal note with the correct amount and memo", () => {
        const outputs = txMap.get(TX_SHIELDING.txid)!.decryptedData?.sapling_outputs ?? [];
        expect(outputs).toHaveLength(1);
        expect(outputs[0].amount).toEqual(new BigNumber(15_768_768));
        expect(outputs[0].transfer_type).toBe("internal");
        expect(outputs[0].memo).toBe("shielding:");
      });

      it("should have no Orchard notes", () => {
        expect(txMap.get(TX_SHIELDING.txid)!.decryptedData?.orchard_outputs ?? []).toHaveLength(0);
      });
    });

    // ── z→z incoming ───────────────────────────────────────────────────────

    describe("shielded-to-shielded incoming — fee > 0, transfer_type = incoming", () => {
      it("should have the correct block height", () => {
        expect(txMap.get(TX_INCOMING.txid)!.blockHeight).toBe(TX_INCOMING.blockHeight);
      });

      it("should have fee = 10 000 zatoshis", () => {
        const tx = txMap.get(TX_INCOMING.txid)!;
        expect(tx.fee).toBeInstanceOf(BigNumber);
        expect(tx.fee).toEqual(new BigNumber(10_000));
        expect(tx.fee.isGreaterThan(0)).toBe(true);
      });

      it("should have one Sapling incoming note with the correct amount and memo", () => {
        const outputs = txMap.get(TX_INCOMING.txid)!.decryptedData?.sapling_outputs ?? [];
        expect(outputs).toHaveLength(1);
        expect(outputs[0].amount).toEqual(new BigNumber(50_000));
        expect(outputs[0].transfer_type).toBe("incoming");
        expect(outputs[0].memo).toBe("test H");
      });

      it("should have no Orchard notes", () => {
        expect(txMap.get(TX_INCOMING.txid)!.decryptedData?.orchard_outputs ?? []).toHaveLength(0);
      });
    });

    // ── z→z outgoing ───────────────────────────────────────────────────────
    // Alice sends ZEC to another shielded address. Her OVK lets the viewing key
    // decrypt the outgoing note. The change is returned as an internal note.

    describe("shielded-to-shielded outgoing — fee > 0, outgoing + internal notes", () => {
      it("should have the correct block height", () => {
        expect(txMap.get(TX_OUTGOING.txid)!.blockHeight).toBe(TX_OUTGOING.blockHeight);
      });

      it("should have fee = 10 000 zatoshis", () => {
        const tx = txMap.get(TX_OUTGOING.txid)!;
        expect(tx.fee).toBeInstanceOf(BigNumber);
        expect(tx.fee).toEqual(new BigNumber(10_000));
        expect(tx.fee.isGreaterThan(0)).toBe(true);
      });

      it("should have one outgoing note (the sent amount) with the correct amount and memo", () => {
        const outputs = txMap.get(TX_OUTGOING.txid)!.decryptedData?.sapling_outputs ?? [];
        const outgoing = outputs.filter(n => n.transfer_type === "outgoing");
        expect(outgoing).toHaveLength(1);
        expect(outgoing[0].amount).toEqual(new BigNumber(10_000));
        expect(outgoing[0].memo).toBe("Pending values");
      });

      it("should have one internal note (the change) with the correct amount", () => {
        const outputs = txMap.get(TX_OUTGOING.txid)!.decryptedData?.sapling_outputs ?? [];
        const internal = outputs.filter(n => n.transfer_type === "internal");
        expect(internal).toHaveLength(1);
        expect(internal[0].amount).toEqual(new BigNumber(1_790_960));
      });

      it("should have no Orchard notes", () => {
        expect(txMap.get(TX_OUTGOING.txid)!.decryptedData?.orchard_outputs ?? []).toHaveLength(0);
      });
    });

    // ── z→t unshielding ────────────────────────────────────────────────────
    // valueBalanceSapling > 0, 0 transparent inputs, 1 transparent output.
    // No shielded output notes are produced, so trial decryption finds nothing.
    // The only way to observe this transaction is via transparent address lookup
    // (e.g. Blockbook / GetTaddressTxids) — outside the scope of syncShielded.

    describe("shielded-to-transparent (unshielding) — invisible to syncShielded", () => {
      it("should NOT be present in syncShielded results", () => {
        expect(txMap.has(TX_Z_TO_T.txid)).toBe(false);
      });

      it("should be at the expected block height (just before the shielding tx)", () => {
        expect(TX_Z_TO_T.blockHeight).toBeLessThan(TX_SHIELDING.blockHeight);
      });
    });
  });
});
