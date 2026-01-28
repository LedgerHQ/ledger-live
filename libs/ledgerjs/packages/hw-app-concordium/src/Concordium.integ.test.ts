import SpeculosTransportHttp, { SpeculosButton } from "@ledgerhq/hw-transport-node-speculos-http";
import Concordium from "./Concordium";
import type { AccountTransaction } from "./types";

const PATH = "44'/919'/0'/0/0";
const EXPECTED_PUBLIC_KEY = "e31d69e500b0f83983fb6080aaa46129cf7c70e27d59b1aae9820b1d03f98402";

describe("Concordium", () => {
  let transport: SpeculosTransportHttp;

  beforeAll(async () => {
    transport = await SpeculosTransportHttp.open({
      apiPort: process.env.SPECULOS_API_PORT,
    });
  });

  afterAll(async () => {
    transport.close();
  });

  describe("getPublicKey", () => {
    it("returns public key", async () => {
      // GIVEN
      const app = new Concordium(transport);

      // WHEN
      const publicKeyPromise = app.getPublicKey(PATH, false);

      const delay = (ms: number): Promise<void> => new Promise(f => setTimeout(f, ms));
      await delay(500);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.BOTH);

      const publicKey = await publicKeyPromise;

      // THEN
      expect(publicKey).toEqual(EXPECTED_PUBLIC_KEY);
    });
  });

  describe("getAddress", () => {
    it("returns address and public key without display", async () => {
      // GIVEN
      const app = new Concordium(transport);

      // WHEN
      const resultPromise = app.getAddress(PATH, false, 0, 0, 0);

      const delay = (ms: number): Promise<void> => new Promise(f => setTimeout(f, ms));
      await delay(500);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.BOTH);

      const result = await resultPromise;

      // THEN
      expect(result).toEqual({
        address: EXPECTED_PUBLIC_KEY,
        publicKey: EXPECTED_PUBLIC_KEY,
      });
    });
  });

  describe("signTransfer", () => {
    it("signs a simple transfer", async () => {
      // GIVEN
      const app = new Concordium(transport);
      const sender = Buffer.alloc(32, 0x01);
      const recipient = Buffer.alloc(32, 0x02);
      const amount = Buffer.alloc(8);
      amount.writeBigUInt64BE(BigInt(1000000));

      const txn: AccountTransaction = {
        sender,
        nonce: BigInt(1),
        expiry: BigInt(1234567890),
        energyAmount: BigInt(501),
        transactionType: 3,
        payload: Buffer.concat([recipient, amount]),
      };

      // WHEN
      const signPromise = app.signTransfer(txn, PATH);

      // Screen flow: Review → Sender (1/2) → Sender (2/2) → Amount → Recipient → Sign
      const delay = (ms: number): Promise<void> => new Promise(f => setTimeout(f, ms));
      await delay(500);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.BOTH);

      const signature = await signPromise;

      // THEN
      expect(signature).toHaveLength(128);
      expect(signature).toMatch(/^[0-9a-f]+$/i);
    });

    // TODO: TransferWithMemo crashes speculos - APDU format needs investigation
    // The hw-app serialization may not match what the Concordium app 5.3.x expects
    it.skip("signs a transfer with memo", async () => {
      // GIVEN
      const app = new Concordium(transport);
      const sender = Buffer.alloc(32, 0x01);
      const recipient = Buffer.alloc(32, 0x02);
      const memo = Buffer.from("test-memo");
      const memoLength = Buffer.alloc(2);
      memoLength.writeUInt16BE(memo.length);
      const amount = Buffer.alloc(8);
      amount.writeBigUInt64BE(BigInt(100000000));

      const txn: AccountTransaction = {
        sender,
        nonce: BigInt(1),
        expiry: BigInt(1234567890),
        energyAmount: BigInt(501),
        transactionType: 22,
        payload: Buffer.concat([recipient, memoLength, memo, amount]),
      };

      // WHEN
      const signPromise = app.signTransfer(txn, PATH);

      // Screen flow: Review → Sender (1/2) → Sender (2/2) → Amount → Recipient → Memo → Sign
      const delay = (ms: number): Promise<void> => new Promise(f => setTimeout(f, ms));
      await delay(500);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.BOTH);

      const signature = await signPromise;

      // THEN
      expect(signature).toHaveLength(128);
      expect(signature).toMatch(/^[0-9a-f]+$/i);
    });
  });
});
