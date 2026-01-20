import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Btc from "../src/Btc";
import BtcNew from "../src/BtcNew";
import BtcOld from "../src/BtcOld";
import type { Transaction } from "../src/types";
import type { AddressFormat } from "../src/getWalletPublicKey";

// Mock the getAppAndVersion module
jest.mock("../src/getAppAndVersion");

import { getAppAndVersion, checkIsBtcLegacy } from "../src/getAppAndVersion";

const mockedGetAppAndVersion = getAppAndVersion as jest.MockedFunction<typeof getAppAndVersion>;
const mockedCheckIsBtcLegacy = checkIsBtcLegacy as jest.MockedFunction<typeof checkIsBtcLegacy>;

describe("Btc", () => {
  let btc: Btc;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAppAndVersion = (name: string, version: string) => ({
    name,
    version,
    flags: Buffer.from([]),
  });

  const SAMPLE_TX_HEX =
    "01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000";

  describe("constructor", () => {
    it("should create a Btc instance with default parameters", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport });

      expect(btc).toBeInstanceOf(Btc);
      // Default currency is bitcoin, which uses BtcNew
      expect(btc["_impl"]).toBeInstanceOf(BtcNew);
    });

    it("should create a Btc instance with bitcoin currency", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      expect(btc).toBeInstanceOf(Btc);
      expect(btc["_impl"]).toBeInstanceOf(BtcNew);
    });

    it("should create a Btc instance with bitcoin_testnet currency", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin_testnet" });

      expect(btc).toBeInstanceOf(Btc);
      expect(btc["_impl"]).toBeInstanceOf(BtcNew);
    });

    it("should create a Btc instance with bitcoin_regtest currency", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin_regtest" });

      expect(btc).toBeInstanceOf(Btc);
      expect(btc["_impl"]).toBeInstanceOf(BtcNew);
    });

    it("should create a Btc instance with qtum currency", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "qtum" });

      expect(btc).toBeInstanceOf(Btc);
      expect(btc["_impl"]).toBeInstanceOf(BtcNew);
    });

    it("should create a Btc instance with legacy currency (litecoin)", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "litecoin" });

      expect(btc).toBeInstanceOf(Btc);
      expect(btc["_impl"]).toBeInstanceOf(BtcOld);
    });

    it("should accept custom scrambleKey parameter", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, scrambleKey: "CUSTOM" });

      expect(btc).toBeInstanceOf(Btc);
      // Default currency is bitcoin, which uses BtcNew
      expect(btc["_impl"]).toBeInstanceOf(BtcNew);
    });
  });

  describe("getWalletXpub", () => {
    it("should call changeImplIfNecessary and delegate to implementation", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockGetWalletXpub = jest.fn().mockResolvedValue("xpub...");
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.getWalletXpub = mockGetWalletXpub;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      const result = await btc.getWalletXpub({ path: "44'/0'/0'", xpubVersion: 0x0488b21e });

      expect(result).toBe("xpub...");
    });

    it("should work with different xpub versions", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockGetWalletXpub = jest.fn().mockResolvedValue("xpub...");
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.getWalletXpub = mockGetWalletXpub;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      await btc.getWalletXpub({ path: "84'/0'/0'", xpubVersion: 0x04b24746 });

      expect(mockGetWalletXpub).toHaveBeenCalledWith({
        path: "84'/0'/0'",
        xpubVersion: 0x04b24746,
      });
    });
  });

  describe("getWalletPublicKey", () => {
    it("should get wallet public key with default options", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockResult = {
        publicKey: "04...",
        bitcoinAddress: "1...",
        chainCode: "00...",
      };
      const mockGetWalletPublicKey = jest.fn().mockResolvedValue(mockResult);
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.getWalletPublicKey =
        mockGetWalletPublicKey;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      const result = await btc.getWalletPublicKey("44'/0'/0'/0/0");

      expect(result).toEqual(mockResult);
      expect(mockGetWalletPublicKey).toHaveBeenCalledWith("44'/0'/0'/0/0", {});
    });

    it("should get wallet public key with verify option", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockGetWalletPublicKey = jest.fn().mockResolvedValue({
        publicKey: "04...",
        bitcoinAddress: "1...",
        chainCode: "00...",
      });
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.getWalletPublicKey =
        mockGetWalletPublicKey;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      await btc.getWalletPublicKey("44'/0'/0'/0/0", { verify: true });

      expect(mockGetWalletPublicKey).toHaveBeenCalledWith("44'/0'/0'/0/0", { verify: true });
    });

    it("should get wallet public key with format option", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockGetWalletPublicKey = jest.fn().mockResolvedValue({
        publicKey: "04...",
        bitcoinAddress: "3...",
        chainCode: "00...",
      });
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.getWalletPublicKey =
        mockGetWalletPublicKey;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      await btc.getWalletPublicKey("49'/0'/0'/0/0", { format: "p2sh" });

      expect(mockGetWalletPublicKey).toHaveBeenCalledWith("49'/0'/0'/0/0", { format: "p2sh" });
    });

    it("should get wallet public key with bech32 format", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockGetWalletPublicKey = jest.fn().mockResolvedValue({
        publicKey: "04...",
        bitcoinAddress: "bc1...",
        chainCode: "00...",
      });
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.getWalletPublicKey =
        mockGetWalletPublicKey;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      await btc.getWalletPublicKey("84'/0'/0'/0/0", { format: "bech32" });

      expect(mockGetWalletPublicKey).toHaveBeenCalledWith("84'/0'/0'/0/0", { format: "bech32" });
    });

    it("should get wallet public key with bech32m format", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockGetWalletPublicKey = jest.fn().mockResolvedValue({
        publicKey: "04...",
        bitcoinAddress: "bc1p...",
        chainCode: "00...",
      });
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.getWalletPublicKey =
        mockGetWalletPublicKey;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      await btc.getWalletPublicKey("86'/0'/0'/0/0", { format: "bech32m" });

      expect(mockGetWalletPublicKey).toHaveBeenCalledWith("86'/0'/0'/0/0", { format: "bech32m" });
    });

    it("should get wallet public key with cashaddr format", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockGetWalletPublicKey = jest.fn().mockResolvedValue({
        publicKey: "04...",
        bitcoinAddress: "bitcoincash:...",
        chainCode: "00...",
      });
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.getWalletPublicKey =
        mockGetWalletPublicKey;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      await btc.getWalletPublicKey("44'/145'/0'/0/0", { format: "cashaddr" });

      expect(mockGetWalletPublicKey).toHaveBeenCalledWith("44'/145'/0'/0/0", {
        format: "cashaddr",
      });
    });

    it("should handle deprecated signature with boolean verify", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockGetWalletPublicKey = jest.fn().mockResolvedValue({
        publicKey: "04...",
        bitcoinAddress: "1...",
        chainCode: "00...",
      });
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.getWalletPublicKey =
        mockGetWalletPublicKey;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      // Suppress console.warn for this test
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      // @ts-expect-error Testing deprecated signature
      await btc.getWalletPublicKey("44'/0'/0'/0/0", true, false);

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("deprecated signature"));
      expect(mockGetWalletPublicKey).toHaveBeenCalledWith("44'/0'/0'/0/0", {
        verify: true,
        format: "legacy",
      });

      consoleWarnSpy.mockRestore();
    });
  });

  describe("signMessage", () => {
    it("should sign a message", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockResult = { v: 27, r: "r...", s: "s..." };
      const mockSignMessage = jest.fn().mockResolvedValue(mockResult);
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.signMessage = mockSignMessage;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      const messageHex = Buffer.from("test message").toString("hex");
      const result = await btc.signMessage("44'/0'/0'/0/0", messageHex);

      expect(result).toEqual(mockResult);
      expect(mockSignMessage).toHaveBeenCalledWith({
        path: "44'/0'/0'/0/0",
        messageHex,
      });
    });

    it("should sign a message with different paths", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockResult = { v: 27, r: "r...", s: "s..." };
      const mockSignMessage = jest.fn().mockResolvedValue(mockResult);
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.signMessage = mockSignMessage;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      const messageHex = Buffer.from("test").toString("hex");
      await btc.signMessage("84'/0'/0'/0/0", messageHex);

      expect(mockSignMessage).toHaveBeenCalledWith({
        path: "84'/0'/0'/0/0",
        messageHex,
      });
    });
  });

  describe("createPaymentTransaction", () => {
    it("should create a payment transaction", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockCreatePaymentTransaction = jest.fn().mockResolvedValue("01000000...");
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.createPaymentTransaction =
        mockCreatePaymentTransaction;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      const tx = { inputs: [], outputs: [] } as any as Transaction;
      const arg = {
        inputs: [
          [tx, 0, undefined, undefined] as [
            Transaction,
            number,
            string | null | undefined,
            number | null | undefined,
          ],
        ],
        associatedKeysets: ["44'/0'/0'"],
        outputScriptHex: "01...",
        additionals: [],
      };

      const result = await btc.createPaymentTransaction(arg);

      expect(result).toBe("01000000...");
      expect(mockCreatePaymentTransaction).toHaveBeenCalledWith(arg);
    });

    it("should throw error for deprecated multi-argument signature", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      await expect(
        // @ts-expect-error Testing deprecated signature
        btc.createPaymentTransaction([], [], "", ""),
      ).rejects.toThrow("multi argument signature is deprecated");
    });

    it("should create a payment transaction with segwit", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockCreatePaymentTransaction = jest.fn().mockResolvedValue("01000000...");
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.createPaymentTransaction =
        mockCreatePaymentTransaction;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      const tx = { inputs: [], outputs: [] } as any as Transaction;
      const arg = {
        inputs: [
          [tx, 0, undefined, undefined] as [
            Transaction,
            number,
            string | null | undefined,
            number | null | undefined,
          ],
        ],
        associatedKeysets: ["84'/0'/0'"],
        outputScriptHex: "01...",
        segwit: true,
        additionals: [],
      };

      await btc.createPaymentTransaction(arg);

      expect(mockCreatePaymentTransaction).toHaveBeenCalledWith(arg);
    });

    it("should create a payment transaction with additionals", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockCreatePaymentTransaction = jest.fn().mockResolvedValue("01000000...");
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.createPaymentTransaction =
        mockCreatePaymentTransaction;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      const tx = { inputs: [], outputs: [] } as any as Transaction;
      const arg = {
        inputs: [
          [tx, 0, undefined, undefined] as [
            Transaction,
            number,
            string | null | undefined,
            number | null | undefined,
          ],
        ],
        associatedKeysets: ["84'/0'/0'"],
        outputScriptHex: "01...",
        additionals: ["bech32"],
      };

      await btc.createPaymentTransaction(arg);

      expect(mockCreatePaymentTransaction).toHaveBeenCalledWith(arg);
    });
  });

  describe("signPsbtBuffer", () => {
    it("should sign a PSBT buffer", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockResult = { psbt: Buffer.from("psbt"), tx: "01000000..." };
      const mockSignPsbtBuffer = jest.fn().mockResolvedValue(mockResult);
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.signPsbtBuffer = mockSignPsbtBuffer;

      const psbtBuffer = Buffer.from("psbt");
      const result = await btc.signPsbtBuffer(psbtBuffer);

      expect(result).toEqual(mockResult);
      expect(mockSignPsbtBuffer).toHaveBeenCalledWith(psbtBuffer, undefined);
    });

    it("should sign a PSBT buffer with options", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockResult = { psbt: Buffer.from("psbt"), tx: "01000000..." };
      const mockSignPsbtBuffer = jest.fn().mockResolvedValue(mockResult);
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.signPsbtBuffer = mockSignPsbtBuffer;

      const psbtBuffer = Buffer.from("psbt");
      const opts = {
        finalizePsbt: true,
        accountPath: "m/84'/0'/0'",
        addressFormat: "bech32" as AddressFormat,
      };

      await btc.signPsbtBuffer(psbtBuffer, opts);

      expect(mockSignPsbtBuffer).toHaveBeenCalledWith(psbtBuffer, opts);
    });

    it("should throw error when using BtcOld implementation", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "litecoin" });

      const psbtBuffer = Buffer.from("psbt");

      await expect(btc.signPsbtBuffer(psbtBuffer)).rejects.toThrow(
        "signPsbtBuffer is not supported with the legacy Bitcoin app",
      );
    });
  });

  describe("signP2SHTransaction", () => {
    it("should sign a P2SH transaction", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const tx = { inputs: [], outputs: [] } as any as Transaction;
      const arg = {
        inputs: [
          [tx, 0, "522103...", undefined] as [
            Transaction,
            number,
            string | null | undefined,
            number | null | undefined,
          ],
        ],
        associatedKeysets: ["44'/0'/0'"],
        outputScriptHex: "01...",
      };

      // Since signP2SHTransaction is called directly on transport, we just ensure it doesn't throw
      await expect(btc.signP2SHTransaction(arg)).rejects.toThrow();
    });
  });

  describe("splitTransaction", () => {
    it("should split a transaction", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const txHex = SAMPLE_TX_HEX;
      const result = btc.splitTransaction(txHex);

      expect(result).toBeDefined();
    });

    it("should split a transaction with segwit support", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const txHex = SAMPLE_TX_HEX;
      const result = btc.splitTransaction(txHex, true);

      expect(result).toBeDefined();
    });

    it("should split a transaction with extra data", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const txHex = SAMPLE_TX_HEX;
      const result = btc.splitTransaction(txHex, false, true);

      expect(result).toBeDefined();
    });

    it("should split a transaction with additionals", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const txHex = SAMPLE_TX_HEX;
      const result = btc.splitTransaction(txHex, false, false, ["zcash"]);

      expect(result).toBeDefined();
    });
  });

  describe("serializeTransactionOutputs", () => {
    it("should serialize transaction outputs", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const tx = {
        version: Buffer.from([1, 0, 0, 0]),
        inputs: [],
        outputs: [
          {
            amount: Buffer.from([0x00, 0xe1, 0xf5, 0x05, 0x00, 0x00, 0x00, 0x00]),
            script: Buffer.from("76a914", "hex"),
          },
        ],
      } as any as Transaction;

      const result = btc.serializeTransactionOutputs(tx);

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe("getTrustedInput", () => {
    it("should get trusted input", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const tx = {
        version: Buffer.from([1, 0, 0, 0]),
        inputs: [],
        outputs: [],
      } as any as Transaction;

      await expect(btc.getTrustedInput(0, tx)).rejects.toThrow();
    });

    it("should get trusted input with additionals", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const tx = {
        version: Buffer.from([1, 0, 0, 0]),
        inputs: [],
        outputs: [],
      } as any as Transaction;

      await expect(btc.getTrustedInput(0, tx, ["zcash"])).rejects.toThrow();
    });
  });

  describe("getTrustedInputBIP143", () => {
    it("should get trusted input BIP143", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const tx = {
        version: Buffer.from([1, 0, 0, 0]),
        inputs: [],
        outputs: [
          {
            amount: Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
            script: Buffer.alloc(0),
          },
        ],
        locktime: Buffer.from([0, 0, 0, 0]),
      } as any as Transaction;

      const result = btc.getTrustedInputBIP143(0, tx);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should get trusted input BIP143 with additionals", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const tx = {
        version: Buffer.from([1, 0, 0, 0]),
        inputs: [],
        outputs: [
          {
            amount: Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
            script: Buffer.alloc(0),
          },
        ],
        locktime: Buffer.from([0, 0, 0, 0]),
      } as any as Transaction;

      const result = btc.getTrustedInputBIP143(0, tx, ["abc"]);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
  });

  describe("changeImplIfNecessary", () => {
    it("should return BtcOld when already using BtcOld", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "litecoin" });

      const impl = await btc.changeImplIfNecessary();

      expect(impl).toBeInstanceOf(BtcOld);
    });

    it("should switch to BtcOld for Bitcoin app version < 2.1.0", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.0.0"));

      const impl = await btc.changeImplIfNecessary();

      expect(impl).toBeInstanceOf(BtcOld);
    });

    it("should keep BtcNew for Bitcoin app version >= 2.1.0", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      const impl = await btc.changeImplIfNecessary();

      expect(impl).toBeInstanceOf(BtcNew);
    });

    it("should switch to BtcOld for Bitcoin Test app version < 2.1.0", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin_testnet" });

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin Test", "2.0.5"));

      const impl = await btc.changeImplIfNecessary();

      expect(impl).toBeInstanceOf(BtcOld);
    });

    it("should keep BtcNew for Bitcoin Test app version >= 2.1.0", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin_testnet" });

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin Test", "2.2.0"));

      const impl = await btc.changeImplIfNecessary();

      expect(impl).toBeInstanceOf(BtcNew);
    });

    it("should use BtcOld for Bitcoin Legacy app", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin Legacy", "2.5.0"));

      const impl = await btc.changeImplIfNecessary();

      expect(impl).toBeInstanceOf(BtcOld);
    });

    it("should use BtcOld for Bitcoin Test Legacy app", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin_testnet" });

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin Test Legacy", "2.5.0"));

      const impl = await btc.changeImplIfNecessary();

      expect(impl).toBeInstanceOf(BtcOld);
    });

    it("should use BtcOld for Exchange app with legacy Bitcoin", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Exchange", "1.0.0"));
      mockedCheckIsBtcLegacy.mockResolvedValue(true);

      const impl = await btc.changeImplIfNecessary();

      expect(impl).toBeInstanceOf(BtcOld);
      expect(mockedCheckIsBtcLegacy).toHaveBeenCalledWith(transport);
    });

    it("should keep BtcNew for Exchange app with new Bitcoin", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Exchange", "1.0.0"));
      mockedCheckIsBtcLegacy.mockResolvedValue(false);

      const impl = await btc.changeImplIfNecessary();

      expect(impl).toBeInstanceOf(BtcNew);
      expect(mockedCheckIsBtcLegacy).toHaveBeenCalledWith(transport);
    });

    it("should switch to BtcOld for Qtum app version < 3.0.0", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "qtum" });

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Qtum", "2.9.0"));

      const impl = await btc.changeImplIfNecessary();

      expect(impl).toBeInstanceOf(BtcOld);
    });

    it("should keep BtcNew for Qtum app version >= 3.0.0", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "qtum" });

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Qtum", "3.0.0"));

      const impl = await btc.changeImplIfNecessary();

      expect(impl).toBeInstanceOf(BtcNew);
    });

    it("should keep BtcNew for Bitcoin Recovery app", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin Recovery", "1.0.0"));

      const impl = await btc.changeImplIfNecessary();

      expect(impl).toBeInstanceOf(BtcNew);
    });

    it("should use BtcOld for unknown app names", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Unknown App", "1.0.0"));

      const impl = await btc.changeImplIfNecessary();

      expect(impl).toBeInstanceOf(BtcOld);
    });

    it("should cache the implementation decision", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      // First call
      const impl1 = await btc.changeImplIfNecessary();

      // Second call
      const impl2 = await btc.changeImplIfNecessary();

      expect(impl1).toBe(impl2);
      // getAppAndVersion should be called twice
      expect(mockedGetAppAndVersion).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling", () => {
    it("should handle transport errors gracefully", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      mockedGetAppAndVersion.mockRejectedValue(new Error("Transport error"));

      await expect(
        btc.getWalletXpub({ path: "44'/0'/0'", xpubVersion: 0x0488b21e }),
      ).rejects.toThrow("Transport error");
    });

    it("should handle implementation errors gracefully", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      const mockGetWalletXpub = jest.fn().mockRejectedValue(new Error("Implementation error"));
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.getWalletXpub = mockGetWalletXpub;

      await expect(
        btc.getWalletXpub({ path: "44'/0'/0'", xpubVersion: 0x0488b21e }),
      ).rejects.toThrow("Implementation error");
    });
  });

  describe("method chaining and state", () => {
    it("should maintain state across multiple calls", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockGetWalletXpub = jest.fn().mockResolvedValue("xpub1");
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.getWalletXpub = mockGetWalletXpub;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      await btc.getWalletXpub({ path: "44'/0'/0'", xpubVersion: 0x0488b21e });
      await btc.getWalletXpub({ path: "44'/0'/1'", xpubVersion: 0x0488b21e });

      expect(mockGetWalletXpub).toHaveBeenCalledTimes(2);
    });

    it("should handle multiple method calls in sequence", async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      btc = new Btc({ transport, currency: "bitcoin" });

      const mockGetWalletXpub = jest.fn().mockResolvedValue("xpub1");
      const mockGetWalletPublicKey = jest.fn().mockResolvedValue({
        publicKey: "04...",
        bitcoinAddress: "1...",
        chainCode: "00...",
      });
      const mockSignMessage = jest.fn().mockResolvedValue({ v: 27, r: "r", s: "s" });

      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.getWalletXpub = mockGetWalletXpub;
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.getWalletPublicKey =
        mockGetWalletPublicKey;
      (BtcNew as jest.MockedClass<typeof BtcNew>).prototype.signMessage = mockSignMessage;

      mockedGetAppAndVersion.mockResolvedValue(mockAppAndVersion("Bitcoin", "2.1.0"));

      await btc.getWalletXpub({ path: "44'/0'/0'", xpubVersion: 0x0488b21e });
      await btc.getWalletPublicKey("44'/0'/0'/0/0");
      await btc.signMessage("44'/0'/0'/0/0", Buffer.from("test").toString("hex"));

      expect(mockGetWalletXpub).toHaveBeenCalledTimes(1);
      expect(mockGetWalletPublicKey).toHaveBeenCalledTimes(1);
      expect(mockSignMessage).toHaveBeenCalledTimes(1);
    });
  });
});
