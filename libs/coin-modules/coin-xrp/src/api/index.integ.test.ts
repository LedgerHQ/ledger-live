import type { Api } from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";
import { decode, encodeForSigning } from "ripple-binary-codec";
import { sign } from "ripple-keypairs";

describe("Xrp Api", () => {
  let module: Api<void>;
  const address = "rh1HPuRVsYYvThxG2Bs1MfjmrVC73S16Fb";
  const bigAddress = "rUxSkt6hQpWxXQwTNRUCYYRQ7BC2yRA3F8"; // An account with more that 4000 txs
  const emptyAddress = "rKtXXTVno77jhu6tto1MAXjepyuaKaLcqB"; // Account with no transaction (at the time of this writing)
  const xrpPubKey = process.env["PUB_KEY"]!;
  const xrpSecretKey = process.env["SECRET_KEY"]!;

  beforeAll(() => {
    module = createApi({ node: "https://s.altnet.rippletest.net:51234" });
  });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // Given
      const amount = BigInt(100);

      // When
      const result = await module.estimateFees({
        type: "send",
        sender: address,
        amount,
        recipient: "rKtXXTVno77jhu6tto1MAXjepyuaKaLcqB",
      });

      // Then
      expect(result).toEqual(BigInt(10));
    });
  });

  describe("listOperations", () => {
    it.skip("returns a list regarding address parameter", async () => {
      // When
      const [tx, _] = await module.listOperations(address, { minHeight: 200 });

      // https://blockexplorer.one/xrp/testnet/address/rh1HPuRVsYYvThxG2Bs1MfjmrVC73S16Fb
      // as of 2025-03-18, the address has 287 transactions
      expect(tx.length).toBeGreaterThanOrEqual(287);
      tx.forEach(operation => {
        const isSenderOrReceipt =
          operation.senders.includes(address) || operation.recipients.includes(address);
        expect(isSenderOrReceipt).toBeTruthy();
      });
    });

    // TO FIX, ops length is 0 for some reason
    it.skip("returns all operations", async () => {
      // When
      const [ops, _] = await module.listOperations(bigAddress, { minHeight: 0 });
      // Then
      const checkSet = new Set(ops.map(elt => elt.tx.hash));
      expect(checkSet.size).toEqual(ops.length);
      // the first transaction is returned
      expect(ops[0].tx.block.height).toEqual(73126713);
      expect(ops[0].tx.hash.toUpperCase).toEqual(
        "0FC3792449E5B1E431D45E3606017D10EC1FECC8EDF988A98E36B8FE0C33ACAE",
      );
      // 200 is the default XRP explorer hard limit,
      // so here we are checking that this limit is bypassed
      expect(ops.length).toBeGreaterThan(200);
    });
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      // When
      const result = await module.lastBlock();

      // Then
      expect(result.hash).toBeDefined();
      expect(result.height).toBeDefined();
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBalance", () => {
    it("returns an amount above 0 when address has transactions", async () => {
      // When
      const result = await module.getBalance(address);

      // Then
      expect(result).toBeGreaterThan(BigInt(0));
    });

    it("returns 0 when address has no transaction", async () => {
      // When
      const result = await module.getBalance(emptyAddress);

      // Then
      expect(result).toBe(BigInt(0));
    });
  });

  describe("craftTransaction", () => {
    it("returns a raw transaction", async () => {
      // When
      const result = await module.craftTransaction({
        type: "send",
        sender: address,
        recipient: "rKRtUG15iBsCQRgrkeUEg5oX4Ae2zWZ89z",
        amount: BigInt(10),
      });

      // Then
      expect(result.length).toEqual(162);
    });
  });

  // To enable this test, you need to fill an `.env` file at the root of this package. Example can be found in `.env.integ.test.example`.
  // The value hardcoded here depends on the value filled in the `.env` file.
  describe.skip("combine", () => {
    it("returns a signed raw transaction", async () => {
      // Given
      const rawTx =
        "120000228000000024001BCDA6201B001F018161400000000000000A6840000000000000018114CF30F590D7A9067B2604D80D46090FBF342EBE988314CA26FB6B0EF6859436C2037BA0A9913208A59B98";
      const signedTx = sign(
        encodeForSigning({
          ...decode(rawTx),
          SigningPubKey: xrpPubKey,
        }),
        xrpSecretKey,
      );

      // When
      const result = await module.combine(rawTx, signedTx);

      // Then
      expect(result).toEqual(
        "120000228000000024001BCDA6201B001F018161400000000000000A68400000000000000174473045022100D3B9B37F40961A8DBDE48535F9EF333E87F9D98BE90F7141E133541874826BDB0220065E9CA4D218F16087656BC30D66672F6103B03717A59FFC04C837A2157CE47C8114CF30F590D7A9067B2604D80D46090FBF342EBE988314CA26FB6B0EF6859436C2037BA0A9913208A59B98",
      );
    });
  });
});
