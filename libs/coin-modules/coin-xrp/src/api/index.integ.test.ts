import { Operation } from "@ledgerhq/coin-framework/api/types";
import { decode } from "ripple-binary-codec";
import { createApi } from ".";
//import { decode, encodeForSigning } from "ripple-binary-codec";
//import { sign } from "ripple-keypairs";

describe("Xrp Api (testnet)", () => {
  const SENDER = "rh1HPuRVsYYvThxG2Bs1MfjmrVC73S16Fb";
  const api = createApi({ node: "https://s.altnet.rippletest.net:51234" });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // Given
      const amount = BigInt(100);

      // When
      const result = await api.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: SENDER,
        amount,
        recipient: "rKtXXTVno77jhu6tto1MAXjepyuaKaLcqB",
        memo: {
          type: "map",
          memos: new Map(),
        },
      });

      // Then
      expect(result.value).toEqual(BigInt(10));
    });
  });

  describe("listOperations", () => {
    it.skip("returns a list regarding address parameter", async () => {
      // When
      const { items: tx } = await api.listOperations(SENDER, { minHeight: 200, order: "asc" });

      // https://blockexplorer.one/xrp/testnet/address/rh1HPuRVsYYvThxG2Bs1MfjmrVC73S16Fb
      // as of 2025-03-18, the address has 287 transactions
      expect(tx.length).toBeGreaterThanOrEqual(287);
      tx.forEach(operation => {
        const isSenderOrReceipt =
          operation.senders.includes(SENDER) || operation.recipients.includes(SENDER);
        expect(isSenderOrReceipt).toBe(true);
        expect(operation.value).toBeGreaterThanOrEqual(200);
        expect(operation.tx.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
        expect(operation.tx.block.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
        expect(operation.tx.block.height).toBeGreaterThanOrEqual(0);
        expect(operation.tx.fees).toBeGreaterThan(0);
        expect(operation.tx.date).toBeInstanceOf(Date);
      });
    });

    // TO FIX, ops length is 0 for some reason
    it.skip("returns all operations", async () => {
      // An account with more that 4000 txs
      const SENDER_WITH_TRANSACTIONS = "rUxSkt6hQpWxXQwTNRUCYYRQ7BC2yRA3F8";

      // When
      const { items: ops } = await api.listOperations(SENDER_WITH_TRANSACTIONS, {
        minHeight: 0,
        order: "asc",
      });
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

    it("returns operations from latest, but in asc order", async () => {
      // When
      const SENDER_WITH_TRANSACTIONS = "rUxSkt6hQpWxXQwTNRUCYYRQ7BC2yRA3F8";
      const { items: txDesc } = await api.listOperations(SENDER_WITH_TRANSACTIONS, {
        minHeight: 200,
        order: "desc",
      });
      expect(txDesc.length).toBeGreaterThanOrEqual(200);
      // Then
      // Check if the result is sorted in ascending order
      expect(txDesc[0].tx.block.height).toBeGreaterThanOrEqual(
        txDesc[txDesc.length - 1].tx.block.height,
      );
    });

    it("returns operations with correct status", async () => {
      // When
      const SENDER_WITH_TRANSACTIONS = "rUxSkt6hQpWxXQwTNRUCYYRQ7BC2yRA3F8";
      const FAILED_TRANSACTIONS = new Set([
        "8C0D8EF7C52BE287F951ECDF01526D2ABF3BF189C56D0B59607DE1A192E72511",
      ]);
      const { items: operations } = await api.listOperations(SENDER_WITH_TRANSACTIONS, {
        minHeight: 200,
        order: "desc",
      });
      expect(operations.length).toBeGreaterThanOrEqual(200);

      // Then
      // Check if status matches reference
      for (const operation of operations) {
        expect(operation.tx.failed).toBe(FAILED_TRANSACTIONS.has(operation.tx.hash));
      }
    });
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      // When
      const result = await api.lastBlock();

      // Then
      expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      expect(result.height).toBeGreaterThan(0);
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBalance", () => {
    // Account with no transaction (at the time of this writing)
    const SENDER_WITH_NO_TRANSACTION = "rKtXXTVno77jhu6tto1MAXjepyuaKaLcqB";

    it("returns a balance", async () => {
      // When
      const result = await api.getBalance(SENDER);

      // Then
      expect(result[0].asset).toEqual({ type: "native" });
      expect(result[0].value).toBeGreaterThanOrEqual(BigInt(0));
    });

    it("returns 0 when address has no transaction", async () => {
      // When
      const result = await api.getBalance(SENDER_WITH_NO_TRANSACTION);

      // Then
      expect(result).toEqual([{ value: BigInt(0), asset: { type: "native" }, locked: 0n }]);
    });

    it("returns 0 when address is not found", async () => {
      const result = await api.getBalance("rhWTXC2m2gGGA9WozUaoMm6kLAVPb1tcS0");

      expect(result).toEqual([{ value: BigInt(0), asset: { type: "native" }, locked: 0n }]);
    });
  });

  describe("craftTransaction", () => {
    const RECIPIENT = "rKRtUG15iBsCQRgrkeUEg5oX4Ae2zWZ89z";

    it("returns a raw transaction", async () => {
      // When
      const { transaction: result } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: BigInt(10),
        memo: {
          type: "map",
          memos: new Map([["memos", ["testdata"]]]),
        },
      });
      // Then
      expect(result.length).toEqual(178);
    });

    it("should use default fees when user does not provide them for crafting a transaction", async () => {
      const { transaction: result } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: BigInt(10),
        memo: {
          type: "map",
          memos: new Map(),
        },
      });

      expect(decode(result)).toMatchObject({
        Fee: "10",
      });
    });

    it("should use custom user fees when user provides it for crafting a transaction", async () => {
      const customFees = 99n;
      const { transaction: result } = await api.craftTransaction(
        {
          intentType: "transaction",
          asset: { type: "native" },
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: BigInt(10),
          memo: {
            type: "map",
            memos: new Map(),
          },
        },
        { value: customFees },
      );

      expect(decode(result)).toMatchObject({
        Fee: customFees.toString(),
      });
    });
  });
});

describe("Xrp Api (mainnet)", () => {
  const SENDER = "rn5BQvhksnPfbo277LtFks4iyYStPKGrnJ";
  const api = createApi({ node: "https://xrp.coin.ledger.com" });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // Given
      const amount = BigInt(100);

      // When
      const result = await api.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: SENDER,
        amount,
        recipient: "r9m6MwViR4GnUNqoGXGa8eroBrZ9FAPHFS",
        memo: {
          type: "map",
          memos: new Map(),
        },
      });

      // Then
      expect(result.value).toEqual(BigInt(10));
    });
  });

  describe("listOperations", () => {
    let ops: Operation[];

    beforeAll(async () => {
      const resp = await api.listOperations(SENDER, { minHeight: 0 });
      ops = resp.items;
    });

    it("returns operations", async () => {
      // https://xrpscan.com/account/rn5BQvhksnPfbo277LtFks4iyYStPKGrnJ
      expect(ops.length).toBeGreaterThanOrEqual(200);
      const checkSet = new Set(ops.map(elt => elt.tx.hash));
      expect(checkSet.size).toEqual(ops.length);
      ops.forEach(operation => {
        const isSenderOrReceipt =
          operation.senders.includes(SENDER) || operation.recipients.includes(SENDER);
        expect(isSenderOrReceipt).toBe(true);
        expect(operation.value).toBeGreaterThanOrEqual(0);
        expect(operation.tx.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
        expect(operation.tx.block.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
        expect(operation.tx.block.height).toBeGreaterThanOrEqual(0);
        expect(operation.tx.fees).toBeGreaterThan(0);
        expect(operation.tx.date).toBeInstanceOf(Date);
      });
    });

    it("returns IN operation", async () => {
      // https://xrpscan.com/tx/805E371FDA0223E8910F831802EE93DBA1A4CA40AC8C1337F26F566CD67788F5
      const inTx = {
        hash: "9E5141DCAE8158E51ED612333FF3EC2D60A3D2DCD2F6DD5E4F92E4A6704C3CE9",
        amount: 7.5,
        recipient: SENDER,
        sender: "rnXQmrXk9HSKdNwkut1k9dpAMVYuBsJV49",
        type: "IN",
        fees: 0.00001,
      };
      const op = ops.find(o => o.tx.hash === inTx.hash) as Operation;
      expect(op.tx.hash).toEqual(inTx.hash);
      expect(op.value).toEqual(BigInt(inTx.amount * 1e6));
      expect(op.recipients).toContain(inTx.recipient);
      expect(op.senders).toContain(inTx.sender);
      expect(op.type).toEqual(inTx.type);
      expect(op.tx.fees).toEqual(BigInt(inTx.fees * 1e6));
    });

    it("returns OUT operation", async () => {
      // https://xrpscan.com/tx/8D13FD7EE0D28B615905903D033A3DC3839FBAA2F545417E3DE51A1A745C1688
      const outTx = {
        hash: "8D13FD7EE0D28B615905903D033A3DC3839FBAA2F545417E3DE51A1A745C1688",
        amount: 0.1,
        recipient: "r3XzsqzQCC6r4ZzifWnwa32sFR2H9exkew",
        sender: SENDER,
        type: "OUT",
        fees: 0.00001,
      };
      const op = ops.find(o => o.tx.hash === outTx.hash) as Operation;
      expect(op.tx.hash).toEqual(outTx.hash);
      expect(op.value).toEqual(BigInt(outTx.amount * 1e6));
      expect(op.recipients).toContain(outTx.recipient);
      expect(op.senders).toContain(outTx.sender);
      expect(op.type).toEqual(outTx.type);
      expect(op.tx.fees).toEqual(BigInt(outTx.fees * 1e6));
    });
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      const result = await api.lastBlock();
      expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      expect(result.height).toBeGreaterThan(0);
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBalance", () => {
    it("returns an amount", async () => {
      const result = await api.getBalance(SENDER);
      expect(result[0].asset).toEqual({ type: "native" });
      expect(result[0].value).toBeGreaterThanOrEqual(BigInt(0));
    });
  });

  describe("craftTransaction", () => {
    const RECIPIENT = "r9m6MwViR4GnUNqoGXGa8eroBrZ9FAPHFS";

    it("returns a raw transaction", async () => {
      const { transaction: result } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: BigInt(10),
        memo: {
          type: "map",
          memos: new Map([["memos", ["testdata"]]]),
        },
      });
      expect(result.length).toEqual(178);
    });

    it("should use default fees when user does not provide them for crafting a transaction", async () => {
      const { transaction: result } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: BigInt(10),
        memo: {
          type: "map",
          memos: new Map(),
        },
      });

      expect(decode(result)).toMatchObject({
        Fee: "10",
      });
    });

    it("should use custom user fees when user provides it for crafting a transaction", async () => {
      const customFees = 99n;
      const { transaction: result } = await api.craftTransaction(
        {
          intentType: "transaction",
          asset: { type: "native" },
          type: "send",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: BigInt(10),
          memo: {
            type: "map",
            memos: new Map(),
          },
        },
        { value: customFees },
      );

      expect(decode(result)).toMatchObject({
        Fee: customFees.toString(),
      });
    });
  });

  describe("broadcast", () => {
    it("returns the error message when sequence is outdated", async () => {
      // This error is thrown after submit call, directly in broadcast method
      const outdatedSequenceTx =
        "120000228000000024052FCD872ECDD7D4AC201B06048C14614000000B085FA59C68400000000000000A73210311146AB612828EBCACF2F0538E031BFEB3C5CEE03C7297F30DF1A9CBDCB44D8C74463044022051E29B81D7C993E42E752FE7277E0F665EEF532CA23B72FBB49699F1E0511A33022069E4C62C9E8FC95AD32DE9FC9154F83BFBF9588FC69558B99D9C85603BFFEDF2811413B9F21190F88C84F71F0B64C5BCA3E4AA0FF7C783142B9D5E5EA5E91068791B65AFF97D15B11B44B929";
      await expect(api.broadcast(outdatedSequenceTx)).rejects.toThrow("sequence");
    });
  });
});

// To enable this test, you need to fill an `.env` file at the root of this package. Example can be found in `.env.integ.test.example`.
// The value hardcoded here depends on the value filled in the `.env` file.
/*describe.skip("combine", () => {
  //const xrpPubKey = process.env["PUB_KEY"]!;
  //const xrpSecretKey = process.env["SECRET_KEY"]!;
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
  */
