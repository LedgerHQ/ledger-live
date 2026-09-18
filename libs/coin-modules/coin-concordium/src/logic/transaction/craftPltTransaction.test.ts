import BigNumber from "bignumber.js";
import { serializeTokenUpdate, TransactionType } from "@ledgerhq/concordium-core";
import { VALID_ADDRESS, VALID_ADDRESS_2 } from "../../test/fixtures";
import { craftPltTransaction } from "./craftPltTransaction";

// Epoch seconds 1_700_000_000, so the header's expiry is 1_700_003_600.
const FROZEN_NOW_MS = 1_700_000_000_000;

const craft = (over: Partial<Parameters<typeof craftPltTransaction>[1]> = {}) =>
  craftPltTransaction(
    { address: VALID_ADDRESS, nextSequenceNumber: 5 },
    {
      tokenId: "Token1",
      recipient: VALID_ADDRESS_2,
      amount: new BigNumber(60000),
      decimals: 2,
      energy: BigInt(1080),
      ...over,
    },
  );

describe("craftPltTransaction", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(FROZEN_NOW_MS));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // The expected bytes were assembled from the wire layout, not from this
  // implementation: the two 32-byte addresses are base58check-decoded
  // independently, and the CBOR blob is the reference vector from
  // `concordium-core/src/plt.test.ts`. A layout change fails here rather than at
  // the device.
  //
  // [sender:32][nonce:8][energyAmount:8][payloadSize:4][expiry:8][type:1]
  //   [token_id_length:1][token_id:6][cbor_length:4][cbor:74]
  //
  // `payloadSize` counts the type byte: 1 + 6 + 4 + 74 + 1 = 86. The header
  // serializer adds it for every transaction kind, which is what the chain
  // accepts for the CCD transfers already in production.
  it("serializes to the exact wire layout the chain and device expect", () => {
    const serialized = serializeTokenUpdate(craft());

    expect(serialized.toString("hex")).toBe(
      "52a9a725cef5e4a18ad2a68b3184341fc1ab33a8dc3893e386075adbbb1ed86f" + // sender
        "0000000000000005" + // nonce
        "0000000000000438" + // energyAmount = 1080
        "00000056" + // payloadSize = 86, the payload plus the type byte
        "000000006553ff10" + // expiry = 1_700_003_600
        "1b" + // type = TokenUpdate (27)
        "06" + // token id length
        "546f6b656e31" + // "Token1"
        "0000004a" + // cbor length = 74
        "81a1687472616e73666572a266616d6f756e74c4822119ea60" + // [{transfer:{amount: 600.00
        "69726563697069656e74d99d73a1035820" + //                 recipient:
        "69752406cc939fc90ca6a73b57cee109963547f942006d219144924f8485fb0d", //  ...}}]
    );
    expect(serialized).toHaveLength(146);
  });

  it("builds a TokenUpdate, not a native transfer", () => {
    expect(craft().type).toBe(TransactionType.TokenUpdate);
  });

  // The chain matches the id against a registered token, so any normalisation
  // here would break the transfer rather than tidy it.
  it("passes the token id through byte for byte", () => {
    expect(craft({ tokenId: "t-USDT" }).payload.tokenId).toEqual(Buffer.from("t-USDT", "utf-8"));
  });

  // The chain enforces `exponent == the token's registered decimals` and rejects
  // a mismatch, so the exponent is the token's, never a wallet default.
  it("takes the amount's exponent from the token's decimals", () => {
    // Tag 4, array of 2, exponent -6 (0x25), then the significand.
    expect(craft({ decimals: 6 }).payload.operations.toString("hex")).toContain("c48225");
    expect(craft({ decimals: 2 }).payload.operations.toString("hex")).toContain("c48221");
  });

  // Signing must reuse the buffered figure persisted at estimation time: the
  // same number reaches the device's "Max fees" step and the user's screen.
  it("puts the persisted energy in the header, unmodified", () => {
    expect(craft({ energy: BigInt(4242) }).header.energyAmount).toBe(BigInt(4242));
  });

  it("emits exactly one operation", () => {
    // 0x81 is a single-element CBOR array. The device answers a second element
    // with 0x6B10, after the user has already been prompted.
    expect(craft().payload.operations[0]).toBe(0x81);
  });

  it("includes the memo in the operations blob when there is one", () => {
    const withMemo = craft({ memo: "salary" });

    expect(withMemo.payload.operations.toString("hex")).toContain(
      Buffer.from("salary", "utf-8").toString("hex"),
    );
    expect(withMemo.payload.operations.length).toBeGreaterThan(craft().payload.operations.length);
  });

  it("omits the memo key entirely when there is none", () => {
    expect(craft().payload.operations.toString("hex")).not.toContain(
      Buffer.from("memo", "utf-8").toString("hex"),
    );
  });

  it("expires an hour after crafting", () => {
    expect(craft().header.expiry).toBe(BigInt(FROZEN_NOW_MS / 1000 + 3600));
  });

  it("defaults the nonce to 0 when the sequence number is unknown", () => {
    expect(
      craftPltTransaction(
        { address: VALID_ADDRESS },
        {
          tokenId: "Token1",
          recipient: VALID_ADDRESS_2,
          amount: new BigNumber(1),
          decimals: 2,
          energy: BigInt(1),
        },
      ).header.nonce,
    ).toBe(BigInt(0));
  });

  it("rejects an unparseable recipient rather than crafting a transfer to nowhere", () => {
    expect(() => craft({ recipient: "not-an-address" })).toThrow();
  });
});
