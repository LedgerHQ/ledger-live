import { Transaction } from "bitcoinjs-lib";
import {
  craftsSigningRequest,
  deviceParameters,
  parseSigningRequest,
  serializeOutputs,
} from "../signingRequest";
import { DerivationModes } from "../selectUtxos";
import { REAL_TXS } from "./helpers/fixtures";

const NOW = new Date("2026-10-06T00:00:00Z");

describe("craftsSigningRequest", () => {
  // Each sample is a real mainnet transaction. PSBT crafting reads previous transactions with the
  // bitcoin parser (`nonWitnessUtxo`), so it must recover the explorer's id and inputs.
  it.each([
    "bitcoin",
    "litecoin",
    "dogecoin",
    "digibyte",
    "qtum",
    "bitcoin_cash",
    "bitcoin_gold",
    "dash",
    "zencash",
  ])("crafts a PSBT for %s, whose real transactions the bitcoin parser reads", currencyId => {
    const { hex, inputs, txid } = REAL_TXS[currencyId];
    const tx = Transaction.fromHex(hex);
    expect(craftsSigningRequest(currencyId)).toBe(false);
    expect(tx.getId()).toBe(txid);
    expect(
      tx.ins.map(input => ({
        txid: Buffer.from(Uint8Array.from(input.hash)).reverse().toString("hex"),
        vout: input.index,
      })),
    ).toEqual(inputs);
  });

  it.each(["komodo", "decred"])(
    "crafts a signing request for %s, whose transactions the bitcoin parser cannot read",
    currencyId => {
      expect(craftsSigningRequest(currencyId)).toBe(true);
      expect(() => Transaction.fromHex(REAL_TXS[currencyId].hex)).toThrow(/./);
    },
  );
});

describe("serializeOutputs", () => {
  const SCRIPT_HEX = "76a9142ed16c2dd7b0cf32c955078f6257ff7443a960d888ac";
  const script = Buffer.from(SCRIPT_HEX, "hex");
  // 887 119 = 0x0d894f, little-endian on 8 bytes.
  const VALUE_HEX = "4f890d0000000000";

  it("serializes count, 8-byte value and script, as a bitcoin transaction does", () => {
    expect(serializeOutputs([{ script, value: 887_119n }], ["komodo", "sapling"])).toBe(
      `01${VALUE_HEX}19${SCRIPT_HEX}`,
    );
  });

  it("inserts Decred's 2-byte script version before the script", () => {
    expect(serializeOutputs([{ script, value: 887_119n }], ["decred"])).toBe(
      `01${VALUE_HEX}000019${SCRIPT_HEX}`,
    );
  });

  it("writes the larger variable-length counts", () => {
    const many = Array.from({ length: 253 }, () => ({ script: Buffer.alloc(0), value: 0n }));
    expect(serializeOutputs(many, []).slice(0, 6)).toBe("fdfd00");
    const long = Buffer.alloc(0x10000);
    expect(serializeOutputs([{ script: long, value: 0n }], []).slice(18, 28)).toBe("fe00000100");
  });
});

describe("serializeOutputs on real transactions", () => {
  // Outputs of the real komodo and decred transactions in REAL_TXS, as the explorer lists them: a
  // device-built transaction must contain them exactly as serialized, which `combine` checks.
  it.each([
    [
      "komodo",
      ["komodo", "sapling"],
      [
        { script: "76a914e0abe10d7986a9c6ef2439cd92980ae6b85307af88ac", value: 1_908_588n },
        { script: "76a914bc7657d298c6cb120da534c9af98a0ede22601ff88ac", value: 989_956_023n },
      ],
    ],
    [
      "decred",
      ["decred"],
      [
        { script: "76a914ee0360b1b5f5557717c868f7fca55679d543881388ac", value: 283_872n },
        { script: "76a914a190375a387b64edd84a2c819bfce10a06ffa92988ac", value: 67_082_946n },
      ],
    ],
  ] as const)(
    "matches the outputs of a real %s transaction",
    (currencyId, additionals, outputs) => {
      const serialized = serializeOutputs(
        outputs.map(o => ({ script: Buffer.from(o.script, "hex"), value: o.value })),
        [...additionals],
      );
      expect(REAL_TXS[currencyId].hex).toContain(serialized);
    },
  );
});

describe("deviceParameters", () => {
  it("gives Komodo its sapling flag, extra data, expiry height and interest locktime", () => {
    expect(deviceParameters("komodo", DerivationModes.LEGACY, "R…", NOW)).toEqual({
      additionals: ["komodo", "sapling"],
      hasExtraData: true,
      sigHashType: 1,
      segwit: false,
      expiryHeight: "00000000",
      lockTime: Math.floor(NOW.getTime() / 1000) - 777,
    });
  });

  it("gives Decred its expiry height, without extra data or locktime", () => {
    expect(deviceParameters("decred", DerivationModes.LEGACY, "Ds…", NOW)).toEqual({
      additionals: ["decred"],
      hasExtraData: false,
      sigHashType: 1,
      segwit: false,
      expiryHeight: "00000000",
    });
  });

  it("flags the address format of a native SegWit sender", () => {
    expect(
      deviceParameters("bitcoin", DerivationModes.NATIVE_SEGWIT, "bc1q…", NOW).additionals,
    ).toEqual(["bitcoin", "bech32"]);
  });
});

describe("parseSigningRequest", () => {
  it("returns nothing for a PSBT and refuses an unknown JSON payload", () => {
    expect(parseSigningRequest("cHNidP8BAA==")).toBeUndefined();
    expect(() => parseSigningRequest('{"type":"other"}')).toThrow(
      "unknown crafted transaction format",
    );
  });
});
