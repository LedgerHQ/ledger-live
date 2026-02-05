import SpeculosTransportHttp, { SpeculosButton } from "@ledgerhq/hw-transport-node-speculos-http";
import Concordium from "./Concordium";
import { AccountAddress } from "./address";
import { TransactionType } from "./types";
import type { Transaction, SigningResult } from "./types";
import { encodeMemoToCbor } from "./cbor";

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
      const sender = AccountAddress.fromBuffer(Buffer.alloc(32, 0x01));
      const recipient = AccountAddress.fromBuffer(Buffer.alloc(32, 0x02));

      const txn: Transaction = {
        header: {
          sender,
          nonce: BigInt(1),
          expiry: BigInt(1234567890),
          energyAmount: BigInt(501),
        },
        type: TransactionType.Transfer,
        payload: {
          toAddress: recipient,
          amount: BigInt(1000000),
        },
      };

      // WHEN
      const signPromise = app.signTransaction(txn, PATH);

      // Screen flow: Review → Sender (1/2) → Sender (2/2) → Amount → Recipient → Sign
      const delay = (ms: number): Promise<void> => new Promise(f => setTimeout(f, ms));
      await delay(500);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.BOTH);

      const result: SigningResult = await signPromise;

      // THEN
      expect(result.signature).toHaveLength(128);
      expect(result.signature).toMatch(/^[0-9a-f]+$/i);
      expect(result.serialized).toBeDefined();
      expect(result.serialized).toMatch(/^[0-9a-f]+$/i);
    });

    it("signs a transfer with memo", async () => {
      // GIVEN
      const app = new Concordium(transport);
      const sender = AccountAddress.fromBuffer(Buffer.alloc(32, 0x01));
      const recipient = AccountAddress.fromBuffer(Buffer.alloc(32, 0x02));

      // Memo must be CBOR-encoded (device expects CBOR text string major type 3)
      const memoText = "test-memo";
      const memo = encodeMemoToCbor(memoText);

      const txn: Transaction = {
        header: {
          sender,
          nonce: BigInt(1),
          expiry: BigInt(1234567890),
          energyAmount: BigInt(501),
        },
        type: TransactionType.TransferWithMemo,
        payload: {
          toAddress: recipient,
          amount: BigInt(100000000),
          memo,
        },
      };

      // WHEN
      const signPromise = app.signTransaction(txn, PATH);

      // Screen flow: Review → Sender (1/2) → Sender (2/2) → Amount → Recipient → Memo → Sign
      // Device decodes CBOR and displays memo as UTF-8 text
      const delay = (ms: number): Promise<void> => new Promise(f => setTimeout(f, ms));
      await delay(500);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.BOTH);

      const result: SigningResult = await signPromise;

      // THEN
      expect(result.signature).toHaveLength(128);
      expect(result.signature).toMatch(/^[0-9a-f]+$/i);
      expect(result.serialized).toBeDefined();
      expect(result.serialized).toMatch(/^[0-9a-f]+$/i);
    });
  });
});
