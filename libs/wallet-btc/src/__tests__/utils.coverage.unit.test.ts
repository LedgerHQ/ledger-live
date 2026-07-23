import BigNumber from "bignumber.js";
import coininfo from "coininfo";
import Bitcoin from "../crypto/bitcoin";
import {
  getRelayFeeFloorSatVb,
  getIncrementalFeeFloorSatVb,
  isTaprootAddress,
  scriptToAddress,
  writeVarInt,
} from "../utils";

const crypto = new Bitcoin({ network: coininfo.bitcoin.main.toBitcoinJS() });
// P2TR output script: OP_1 (0x51) OP_PUSH32 (0x20) <32 bytes>
const p2trScript = Buffer.concat([Buffer.from([0x51, 0x20]), Buffer.alloc(32, 0x07)]);
const p2trAddress = scriptToAddress(p2trScript, crypto);

const explorerReturning = (net: unknown) => ({ getNetwork: async () => net });

describe("getRelayFeeFloorSatVb", () => {
  it("returns the default floor when the explorer has no getNetwork", async () => {
    expect((await getRelayFeeFloorSatVb({}, new BigNumber(0))).toNumber()).toBe(0);
  });

  it("converts BTC/kB relay_fee to sat/vB", async () => {
    // 0.00002000 BTC/kB = 2 sat/vB
    const res = await getRelayFeeFloorSatVb(explorerReturning({ relay_fee: "0.00002000" }));
    expect(res.toNumber()).toBe(2);
  });

  it("clamps to a minimum of 1 sat/vB", async () => {
    const res = await getRelayFeeFloorSatVb(explorerReturning({ relay_fee: "0.00000050" }));
    expect(res.toNumber()).toBe(1);
  });

  it("returns the default floor when relay_fee is missing", async () => {
    expect((await getRelayFeeFloorSatVb(explorerReturning({}), new BigNumber(3))).toNumber()).toBe(
      3,
    );
  });

  it("returns the default floor when getNetwork throws", async () => {
    const explorer = {
      getNetwork: async () => {
        throw new Error("boom");
      },
    };
    expect((await getRelayFeeFloorSatVb(explorer, new BigNumber(7))).toNumber()).toBe(7);
  });
});

describe("getIncrementalFeeFloorSatVb", () => {
  it("uses ceil(10% of original) when > 1 sat/vB and no explorer value", async () => {
    // 15 sat/vB → 10% = 1.5 → ceil 2
    expect((await getIncrementalFeeFloorSatVb({}, new BigNumber(15))).toNumber()).toBe(2);
  });

  it("floors to 1 sat/vB when 10% of original is below 1", async () => {
    // 5 sat/vB → 10% = 0.5 → ceil 1
    expect((await getIncrementalFeeFloorSatVb({}, new BigNumber(5))).toNumber()).toBe(1);
  });

  it("takes the max of the explorer incremental_fee and the rule bump", async () => {
    // incremental 0.00003000 = 3 sat/vB; original 15 → rule bump 2 → max = 3
    const res = await getIncrementalFeeFloorSatVb(
      explorerReturning({ incremental_fee: "0.00003000" }),
      new BigNumber(15),
    );
    expect(res.toNumber()).toBe(3);
  });

  it("falls back to the rule bump when incremental_fee is missing", async () => {
    const res = await getIncrementalFeeFloorSatVb(explorerReturning({}), new BigNumber(15));
    expect(res.toNumber()).toBe(2);
  });
});

describe("isTaprootAddress", () => {
  it("returns false for a non-taproot bitcoin address", () => {
    expect(isTaprootAddress("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2", "bitcoin")).toBe(false);
  });

  it("returns false for a currency without taproot support", () => {
    expect(isTaprootAddress(p2trAddress, "litecoin" as never)).toBe(false);
  });
});

describe("scriptToAddress", () => {
  it("decodes a standard P2PKH script to a base58 address", () => {
    const p2pkh = Buffer.concat([
      Buffer.from([0x76, 0xa9, 0x14]),
      Buffer.alloc(20, 0x01),
      Buffer.from([0x88, 0xac]),
    ]);
    expect(scriptToAddress(p2pkh, crypto).startsWith("1")).toBe(true);
  });

  it("decodes a P2TR script to a bech32m (bc1p) address via the fallback", () => {
    expect(p2trAddress.startsWith("bc1p")).toBe(true);
  });
});

describe("writeVarInt", () => {
  it("encodes values across the varint size thresholds", () => {
    const buffer = Buffer.alloc(16);
    // 1-byte
    expect(writeVarInt(buffer, 0xfc, 0)).toBe(1);
    // 3-byte (0xfd prefix)
    expect(writeVarInt(buffer, 0xffff, 0)).toBe(3);
    // 5-byte (0xfe prefix)
    expect(writeVarInt(buffer, 0xffffffff, 0)).toBe(5);
  });
});
