/**
 * Integration tests for ZCashNative against the real Zcash mainnet gRPC endpoint.
 * Run only locally: pnpm test-integ
 * Not run in CI (pnpm test ignores *.integ.test.ts).
 *
 * Expected values are cross-referenced with the Rust integration tests in
 * ledger-zcash-utils/crates/zcash-sync/tests/integration_sync.rs
 */
import BigNumber from "bignumber.js";
import { firstValueFrom } from "rxjs";
import { ZCashNative } from "../src/ZCashNative";
import { ZCASH_GRPC_URL_MAINNET } from "../src/constants";
import type { ShieldedSyncResult } from "../src/types";
import type { ShieldedTransaction } from "../src/types";

// Alice's mainnet UFVK — public test key, never use with real funds.
const ALICE_UFVK =
  "uview1qggz6nejagvka9wtm9r7xf84kkwy4cc0cgchptr98w0cyz33cj4958q5ulkd32nz2u3s0sp9yhcw7tu2n3nlw9x6ulghyd2zgc857tnzme2zpr3vn24zhtm2rjduv9a5zxlmzz404n7l0k69gmu4tfn2g3vpcn03rhz63e3l92fn8gra37tyly7utvgveswl20vz23pu84rc2nyqess38wvlgr2xzyhgj232ne5qutpe6ql6ghzetdy7pfzcmdzd5gd5dnwk25fwv7nnzmnty7u5ax3nzzgr6pdc905ckpd0s9v2cvn7e03qm7r46e5ngax536ywz7zxjptymm90px0rhvmqtwvttuy6d7degly023lqvskclk6mezyt69dwu6c4tfzrjgq4uuh5xa9m5dclgatykgtrrw268qe5pldfkx73f2kd5yyy2tjpjql92pa6tsk2nh2h88q23nee9z379het4akl6haqmuwf9d0nl0susg4tnxyk";

// ── Known Alice mainnet Orchard transactions ──────────────────────────────────
// Cross-referenced with zingo-cli and Rust integration tests.

/** TX1: shielded incoming — fee 10,000 zat, memo "Don't be Nozy" */
const TX1 = {
  txid: "d592576d3b57264a5003c495e4808cdfcb6e055a331178597f7889067ea512de",
  blockHeight: 3_047_167,
  fee: new BigNumber(10_000),
  orchardNotes: [
    {
      amount: new BigNumber(1_247_504),
      transfer_type: "incoming",
      memo: "Don\u2019t be Nozy",
    },
  ],
};

/** TX2: change (internal) note — fee 15,000 zat */
const TX2 = {
  txid: "22e5f6de0750db0d3e5e0f003339b4d435f7f7e5f3820f898e6ecda411ab0d6a",
  blockHeight: 3_055_407,
  fee: new BigNumber(15_000),
  orchardNotes: [{ amount: new BigNumber(122_504), transfer_type: "internal", memo: "" }],
};

/** TX3: change (internal) note — fee 15,000 zat */
const TX3 = {
  txid: "0b5baa0c01ea74f93effe5cc0566eaf086bf67329ff2923bc07a5d0e8859a65e",
  blockHeight: 3_055_417,
  fee: new BigNumber(15_000),
  orchardNotes: [{ amount: new BigNumber(7_504), transfer_type: "internal", memo: "" }],
};

// Smallest range covering all 3 transactions (~8,251 blocks, <1s at 72k bl/s).
const SCAN_START = TX1.blockHeight;

// ─────────────────────────────────────────────────────────────────────────────

describe("ZCashNative integration (real gRPC, mainnet)", () => {
  describe("getChainTip", () => {
    it("should return a realistic mainnet chain tip (> 3,000,000)", async () => {
      const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_MAINNET, network: "mainnet" });
      const tip = await engine.getChainTip();
      expect(typeof tip).toBe("number");
      expect(Number.isInteger(tip)).toBe(true);
      expect(tip).toBeGreaterThan(3_000_000);
    });
  });

  describe("syncShielded — empty range", () => {
    it("should emit one result with no transactions when already at tip", async () => {
      const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_MAINNET, network: "mainnet" });
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

  describe("syncShielded — Alice's known Orchard transactions", () => {
    // Single chunk covering TX1→TX3 (~8,251 blocks).
    let txMap: Map<string, ShieldedTransaction>;

    beforeAll(async () => {
      const engine = new ZCashNative({ grpcUrl: ZCASH_GRPC_URL_MAINNET, network: "mainnet" });
      const result = await firstValueFrom(
        engine.syncShielded({
          startBlockHeight: SCAN_START,
          viewingKey: ALICE_UFVK,
          maxBatchSize: 10_000,
        }),
      );
      txMap = new Map(result.transactions.map(tx => [tx.id, tx]));
    }, 30_000);

    it("should find all three known Orchard transactions", () => {
      expect(txMap.has(TX1.txid)).toBe(true);
      expect(txMap.has(TX2.txid)).toBe(true);
      expect(txMap.has(TX3.txid)).toBe(true);
    });

    // ── TX1: incoming ────────────────────────────────────────────────────────

    describe("TX1 — incoming Orchard note", () => {
      it("should have the correct block height", () => {
        expect(txMap.get(TX1.txid)!.blockHeight).toBe(TX1.blockHeight);
      });

      it("should have fee = 10,000 zatoshis", () => {
        expect(txMap.get(TX1.txid)!.fee).toEqual(TX1.fee);
      });

      it("should have one incoming Orchard note with the correct amount and memo", () => {
        const notes = txMap.get(TX1.txid)!.decryptedData?.orchard_outputs ?? [];
        expect(notes).toHaveLength(1);
        expect(notes[0].transfer_type).toBe("incoming");
        expect(notes[0].amount).toEqual(TX1.orchardNotes[0].amount);
        expect(notes[0].memo).toBe(TX1.orchardNotes[0].memo);
      });

      it("should have no Sapling notes", () => {
        expect(txMap.get(TX1.txid)!.decryptedData?.sapling_outputs ?? []).toHaveLength(0);
      });
    });

    // ── TX2: internal (change) ───────────────────────────────────────────────

    describe("TX2 — internal (change) Orchard note", () => {
      it("should have the correct block height", () => {
        expect(txMap.get(TX2.txid)!.blockHeight).toBe(TX2.blockHeight);
      });

      it("should have fee = 15,000 zatoshis", () => {
        expect(txMap.get(TX2.txid)!.fee).toEqual(TX2.fee);
      });

      it("should have one internal Orchard note with the correct amount", () => {
        const notes = txMap.get(TX2.txid)!.decryptedData?.orchard_outputs ?? [];
        expect(notes).toHaveLength(1);
        expect(notes[0].transfer_type).toBe("internal");
        expect(notes[0].amount).toEqual(TX2.orchardNotes[0].amount);
      });

      it("should have no Sapling notes", () => {
        expect(txMap.get(TX2.txid)!.decryptedData?.sapling_outputs ?? []).toHaveLength(0);
      });
    });

    // ── TX3: internal (change) ───────────────────────────────────────────────

    describe("TX3 — internal (change) Orchard note", () => {
      it("should have the correct block height", () => {
        expect(txMap.get(TX3.txid)!.blockHeight).toBe(TX3.blockHeight);
      });

      it("should have fee = 15,000 zatoshis", () => {
        expect(txMap.get(TX3.txid)!.fee).toEqual(TX3.fee);
      });

      it("should have one internal Orchard note with the correct amount", () => {
        const notes = txMap.get(TX3.txid)!.decryptedData?.orchard_outputs ?? [];
        expect(notes).toHaveLength(1);
        expect(notes[0].transfer_type).toBe("internal");
        expect(notes[0].amount).toEqual(TX3.orchardNotes[0].amount);
      });

      it("should have no Sapling notes", () => {
        expect(txMap.get(TX3.txid)!.decryptedData?.sapling_outputs ?? []).toHaveLength(0);
      });
    });

    // ── Range integrity ──────────────────────────────────────────────────────

    it("transactions should be in ascending block height order", () => {
      const heights = [...txMap.values()].map(tx => tx.blockHeight);
      const sorted = [...heights].sort((a, b) => a - b);
      expect(heights).toEqual(sorted);
    });
  });
});
