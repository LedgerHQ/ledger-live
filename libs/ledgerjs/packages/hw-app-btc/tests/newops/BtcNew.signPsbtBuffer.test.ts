import BtcNew from "../../src/BtcNew";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Transport from "@ledgerhq/hw-transport";
import { finalize } from "../../src/newops/psbtFinalizer";
import { extract } from "../../src/newops/psbtExtractor";
import { TestingClient } from "./integrationtools";

// We mock @ledgerhq/psbtv2 to control PSBT behaviour and hit specific
// branches in signPsbtBuffer without having to build real PSBTs.

let mockPsbtVersion = 2;
let getInputNonWitnessUtxoCalls = 0;
let getInputOutputIndexCalls = 0;

interface MockWitnessUtxo {
  scriptPubKey: Buffer;
}

interface MockOutputConfig {
  scriptPubKey: Buffer;
  bip32DerivationPath: number[] | null;
  wrongFingerprint?: boolean;
}

interface MockPsbtConfig {
  inputCount: number;
  outputCount: number;
  witnessUtxo?: MockWitnessUtxo;
  nonWitnessUtxo?: Buffer;
  inputOutputIndex?: number;
  redeemScript?: Buffer;
  bip32DerivationPath: number[] | null;
  outputs: MockOutputConfig[];
}

const mockPsbtConfig: MockPsbtConfig = {
  inputCount: 1,
  outputCount: 0,
  witnessUtxo: undefined,
  nonWitnessUtxo: undefined,
  inputOutputIndex: undefined,
  redeemScript: undefined,
  // Default to a purpose that does not matter much for these tests.
  bip32DerivationPath: [0x80000054, 0x80000000, 0x80000000, 0, 0],
  outputs: [],
};

jest.mock("@ledgerhq/psbtv2", () => {
  const actual = jest.requireActual("@ledgerhq/psbtv2");
  const localPsbtIn = actual.psbtIn;
  const localPsbtOut = actual.psbtOut;

  class MockPsbtV2 {
    static getPsbtVersionNumber(): number {
      return mockPsbtVersion;
    }

    // For these tests we never exercise PSBT v0, but we still
    // provide a stub to satisfy the API.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static fromV0(_buf: Buffer, _upgradeInputs: boolean): MockPsbtV2 {
      return new MockPsbtV2();
    }
    // Methods used by BtcNew.signPsbtBuffer / signPsbt
    deserialize(_buf: Buffer): void {
      return;
    }

    getGlobalInputCount(): number {
      return mockPsbtConfig.inputCount;
    }

    getGlobalOutputCount(): number {
      return mockPsbtConfig.outputCount;
    }

    getInputKeyDatas(_index: number, keyType: number): Buffer[] {
      if (keyType === localPsbtIn.BIP32_DERIVATION) {
        return mockPsbtConfig.bip32DerivationPath ? [Buffer.alloc(33, 1)] : [];
      }
      if (keyType === localPsbtIn.TAP_BIP32_DERIVATION) {
        return mockPsbtConfig.bip32DerivationPath ? [] : [Buffer.alloc(32, 2)];
      }
      return [];
    }

    getOutputKeyDatas(index: number, keyType: number): Buffer[] {
      const output = mockPsbtConfig.outputs[index];
      if (!output || !output.bip32DerivationPath) {
        return [];
      }
      if (keyType === localPsbtOut.BIP_32_DERIVATION) {
        return [Buffer.alloc(33, 5)];
      }
      if (keyType === localPsbtOut.TAP_BIP32_DERIVATION) {
        return [Buffer.alloc(32, 6)];
      }
      return [];
    }

    getInputBip32Derivation(
      _index: number,
      _pubkey: Buffer,
    ): { path: number[]; masterFingerprint: Buffer } | null {
      if (!mockPsbtConfig.bip32DerivationPath) {
        return null;
      }
      return {
        path: mockPsbtConfig.bip32DerivationPath,
        masterFingerprint: Buffer.from([1, 2, 3, 4]),
      };
    }

    getInputTapBip32Derivation(
      _index: number,
      _pubkey: Buffer,
    ): { path: number[]; masterFingerprint: Buffer } | null {
      if (!mockPsbtConfig.bip32DerivationPath) {
        return null;
      }
      return {
        path: mockPsbtConfig.bip32DerivationPath,
        masterFingerprint: Buffer.from([1, 2, 3, 4]),
      };
    }

    getOutputBip32Derivation(
      index: number,
      _pubkey: Buffer,
    ): { path: number[]; masterFingerprint: Buffer } | null {
      const output = mockPsbtConfig.outputs[index];
      if (!output || !output.bip32DerivationPath) {
        return null;
      }
      return {
        path: output.bip32DerivationPath,
        masterFingerprint: output.wrongFingerprint
          ? Buffer.from([0xaa, 0xbb, 0xcc, 0xdd])
          : Buffer.from([1, 2, 3, 4]),
      };
    }

    getOutputTapBip32Derivation(
      index: number,
      _pubkey: Buffer,
    ): { path: number[]; masterFingerprint: Buffer; hashes: Buffer[] } | null {
      const output = mockPsbtConfig.outputs[index];
      if (!output || !output.bip32DerivationPath) {
        return null;
      }
      return {
        path: output.bip32DerivationPath,
        masterFingerprint: output.wrongFingerprint
          ? Buffer.from([0xaa, 0xbb, 0xcc, 0xdd])
          : Buffer.from([1, 2, 3, 4]),
        hashes: [],
      };
    }

    getOutputScript(index: number): Buffer {
      const output = mockPsbtConfig.outputs[index];
      return output ? output.scriptPubKey : Buffer.alloc(0);
    }

    getInputWitnessUtxo(_index: number): MockWitnessUtxo | undefined {
      return mockPsbtConfig.witnessUtxo;
    }

    getInputNonWitnessUtxo(_index: number): Buffer | undefined {
      getInputNonWitnessUtxoCalls += 1;
      return mockPsbtConfig.nonWitnessUtxo;
    }

    getInputOutputIndex(_index: number): number | undefined {
      getInputOutputIndexCalls += 1;
      return mockPsbtConfig.inputOutputIndex;
    }

    getInputRedeemScript(_index: number): Buffer | undefined {
      return mockPsbtConfig.redeemScript;
    }

    setInputTapKeySig(_index: number, _sig: Buffer): void {
      return;
    }

    setInputPartialSig(_index: number, _pubkey: Buffer, _sig: Buffer): void {
      return;
    }

    setInputBip32Derivation(
      _index: number,
      _pubkey: Buffer,
      _fingerprint: Buffer,
      _path: number[],
    ): void {
      return;
    }

    setInputTapBip32Derivation(
      _index: number,
      _pubkey: Buffer,
      _hashes: Buffer[],
      _fingerprint: Buffer,
      _path: number[],
    ): void {
      return;
    }

    setOutputBip32Derivation(
      _index: number,
      _pubkey: Buffer,
      _fingerprint: Buffer,
      _path: number[],
    ): void {
      return;
    }

    setOutputTapBip32Derivation(
      _index: number,
      _pubkey: Buffer,
      _hashes: Buffer[],
      _fingerprint: Buffer,
      _path: number[],
    ): void {
      return;
    }

    getInputSighashType(_index: number): number | undefined {
      return undefined;
    }

    copy(target: MockPsbtV2): void {
      // For our test it is enough that serialize() on the copied
      // instance returns a deterministic buffer.
      // We do not need to actually copy state.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _unused = target;
    }

    serialize(): Buffer {
      return Buffer.from("010203", "hex");
    }
  }

  return {
    ...actual,
    PsbtV2: MockPsbtV2,
    psbtIn: localPsbtIn,
    psbtOut: localPsbtOut,
  };
});
jest.mock("../../src/newops/psbtFinalizer", () => ({
  finalize: jest.fn(),
}));

jest.mock("../../src/newops/psbtExtractor", () => ({
  extract: jest.fn(),
}));

class MockClient extends TestingClient {
  constructor(transport: Transport) {
    super(transport);
  }
  lastWalletPolicy?: any;

  async getMasterFingerprint(): Promise<Buffer> {
    return Buffer.from([1, 2, 3, 4]);
  }

  async getExtendedPubkey(_display: boolean, _path: number[]): Promise<string> {
    return "tpubDCwYjpDhUdPGP5rS3wgNg13mTrrjBuG8V9VpWbyptX6TRPbNoZVXsoVUSkCjmQ8jJycjuDKBb9eataSymXakTTaGifxR6kmVsfFehH1ZgJT";
  }

  async signPsbt(
    _psbt: any,
    walletPolicy: any,
    _walletHMAC: Buffer,
    _progressCallback: () => void,
  ): Promise<Map<number, Buffer>> {
    this.lastWalletPolicy = walletPolicy;
    return new Map([[0, Buffer.alloc(64, 0)]]);
  }
}

async function createClient(): Promise<[MockClient, Transport]> {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const client = new MockClient(transport);
  return [client, transport];
}

function makePsbtBuffer(): Buffer {
  // We do not care about the actual bytes because PsbtV2 is mocked;
  // only the version number returned by getPsbtVersionNumber is used.
  return Buffer.from("70736274ff", "hex");
}

function makeScriptPubKeyP2wpkh(): Buffer {
  const bytes: number[] = [0x00, 0x14];
  while (bytes.length < 22) {
    bytes.push(1);
  }
  return Buffer.from(bytes);
}

function makeScriptPubKeyP2pkh(): Buffer {
  const bytes: number[] = [0x76, 0xa9, 0x14];
  while (bytes.length < 23) {
    bytes.push(2);
  }
  bytes.push(0x88, 0xac);
  return Buffer.from(bytes);
}

function makeScriptPubKeyP2tr(): Buffer {
  const bytes: number[] = [0x51, 0x20];
  while (bytes.length < 34) {
    bytes.push(3);
  }
  return Buffer.from(bytes);
}

function makeScriptPubKeyP2wpkhWrapped(): Buffer {
  // OP_HASH160 <20-byte-script-hash> OP_EQUAL
  const bytes: number[] = [0xa9, 0x14];
  while (bytes.length < 22) {
    bytes.push(4);
  }
  bytes.push(0x87);
  return Buffer.from(bytes);
}

function makeLegacyNonWitnessUtxo(outputScripts: Buffer[]): Buffer {
  if (outputScripts.length > 0xfc) {
    throw new Error("Test helper supports up to 252 outputs");
  }
  const version = Buffer.from([0x01, 0x00, 0x00, 0x00]);
  const inputCount = Buffer.from([0x01]);
  const prevout = Buffer.concat([
    Buffer.alloc(32, 0), // prev txid
    Buffer.from([0xff, 0xff, 0xff, 0xff]), // prev index
  ]);
  const scriptSigLen = Buffer.from([0x00]);
  const sequence = Buffer.from([0xff, 0xff, 0xff, 0xff]);
  const input = Buffer.concat([prevout, scriptSigLen, sequence]);

  const outputCount = Buffer.from([outputScripts.length]);
  const outputs = Buffer.concat(
    outputScripts.map(script => {
      if (script.length > 0xfc) {
        throw new Error("Test helper supports scripts up to 252 bytes");
      }
      return Buffer.concat([
        Buffer.alloc(8, 0), // amount
        Buffer.from([script.length]),
        script,
      ]);
    }),
  );

  const locktime = Buffer.alloc(4, 0);
  return Buffer.concat([version, inputCount, input, outputCount, outputs, locktime]);
}

function makeUnsupportedScriptPubKey(): Buffer {
  // Something that does not match any of the known templates
  return Buffer.from([0x6a, 0x01, 0x00]);
}

// Default options for signPsbtBuffer (now required after refactoring).
// Tests that don't care about specific values can spread this object.
const defaultSignOptions = {
  accountPath: "m/84'/0'/0'",
  addressFormat: "bech32" as const,
};

describe("BtcNew.signPsbtBuffer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getInputNonWitnessUtxoCalls = 0;
    getInputOutputIndexCalls = 0;
    mockPsbtConfig.inputCount = 1;
    mockPsbtConfig.outputCount = 0;
    mockPsbtConfig.witnessUtxo = undefined;
    mockPsbtConfig.nonWitnessUtxo = undefined;
    mockPsbtConfig.inputOutputIndex = undefined;
    mockPsbtConfig.redeemScript = undefined;
    mockPsbtConfig.bip32DerivationPath = [0x80000054, 0x80000000, 0x80000000, 0, 0];
    mockPsbtConfig.outputs = [];
  });

  test("throws on unsupported witness script type", async () => {
    mockPsbtVersion = 2;
    mockPsbtConfig.inputCount = 1;
    mockPsbtConfig.witnessUtxo = {
      scriptPubKey: makeUnsupportedScriptPubKey(),
    };

    const [client, transport] = await createClient();
    const btcNew = new BtcNew(client);

    await expect(
      btcNew.signPsbtBuffer(makePsbtBuffer(), { ...defaultSignOptions }),
    ).rejects.toThrow(/Unsupported script type/);

    await transport.close();
  });

  test("infers account type from witness UTXO script", async () => {
    mockPsbtVersion = 2;
    mockPsbtConfig.inputCount = 1;
    mockPsbtConfig.bip32DerivationPath = [0x80000054, 0x80000000, 0x80000000, 0, 0];
    jest.mocked(extract).mockReturnValue(Buffer.from("deadbeef", "hex"));

    const [client, transport] = await createClient();
    const btcNew = new BtcNew(client);

    mockPsbtConfig.witnessUtxo = { scriptPubKey: makeScriptPubKeyP2tr() };
    let result = await btcNew.signPsbtBuffer(makePsbtBuffer(), { ...defaultSignOptions });
    expect(result.tx).toBe("deadbeef");

    mockPsbtConfig.witnessUtxo = { scriptPubKey: makeScriptPubKeyP2wpkhWrapped() };
    jest.mocked(extract).mockReturnValue(Buffer.from("cafebabe", "hex"));
    result = await btcNew.signPsbtBuffer(makePsbtBuffer(), { ...defaultSignOptions });
    expect(result.tx).toBe("cafebabe");

    await transport.close();
  });

  test("infers account type from addressFormat when no witness UTXO or redeemScript", async () => {
    mockPsbtVersion = 2;
    mockPsbtConfig.inputCount = 1;
    mockPsbtConfig.witnessUtxo = undefined;
    mockPsbtConfig.redeemScript = undefined;
    mockPsbtConfig.bip32DerivationPath = [0x80000054, 0x80000000, 0x80000000, 0, 0];
    jest.mocked(extract).mockReturnValue(Buffer.from("cafebabe", "hex"));

    const [client, transport] = await createClient();
    const btcNew = new BtcNew(client);

    async function expectFormat(format: any) {
      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), {
        ...defaultSignOptions,
        addressFormat: format,
      });
      expect(result.tx).toBe("cafebabe");
    }

    await expectFormat("legacy");
    await expectFormat("p2sh");
    await expectFormat("bech32");
    await expectFormat("bech32m");

    await transport.close();
  });

  test("infers account type from BIP32 purpose when no witness UTXO, redeemScript or addressFormat", async () => {
    mockPsbtVersion = 2;
    mockPsbtConfig.inputCount = 1;
    mockPsbtConfig.witnessUtxo = undefined;
    mockPsbtConfig.redeemScript = undefined;
    jest.mocked(extract).mockReturnValue(Buffer.from("baadf00d", "hex"));

    const [client, transport] = await createClient();
    const btcNew = new BtcNew(client);

    const purposeToFormat: Record<number, [string, string]> = {
      44: ["m/44'/0'/0'", "legacy"],
      49: ["m/49'/0'/0'", "p2sh"],
      84: ["m/84'/0'/0'", "bech32"],
      86: ["m/86'/0'/0'", "bech32m"],
      45: ["m/45'/0'/0'", "bech32"], // Unknown purpose, default format
    };

    async function expectPurpose(purpose: number) {
      const [accountPath, addressFormat] = purposeToFormat[purpose];
      mockPsbtConfig.bip32DerivationPath = [0x80000000 + purpose, 0x80000000, 0x80000000, 0, 0];
      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), {
        accountPath,
        addressFormat: addressFormat as any,
      });
      expect(result.tx).toBe("baadf00d");
    }

    await expectPurpose(44);
    await expectPurpose(49);
    await expectPurpose(84);
    await expectPurpose(86);
    // Unknown purpose defaults to native segwit but still signs
    await expectPurpose(45);

    await transport.close();
  });

  test("throws if PSBT has no inputs", async () => {
    mockPsbtVersion = 2;
    mockPsbtConfig.inputCount = 0;

    const [client, transport] = await createClient();
    const btcNew = new BtcNew(client);

    await expect(
      btcNew.signPsbtBuffer(makePsbtBuffer(), { ...defaultSignOptions }),
    ).rejects.toThrow("No inputs in PSBT");

    await transport.close();
  });

  test("uses BIP32 derivation from PSBT when available and finalizes by default", async () => {
    mockPsbtVersion = 2;
    mockPsbtConfig.inputCount = 1;
    mockPsbtConfig.witnessUtxo = {
      scriptPubKey: makeScriptPubKeyP2wpkh(),
    };

    jest.mocked(extract).mockReturnValue(Buffer.from("deadbeef", "hex"));

    const [client, transport] = await createClient();
    const btcNew = new BtcNew(client);

    const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), { ...defaultSignOptions });

    // One account xpub request based on BIP32 derivation information
    // is expected; we cannot easily introspect internal calls on the
    // existing MockClient but this is indirectly exercised by the
    // absence of thrown errors.
    expect(finalize).toHaveBeenCalledTimes(1);
    expect(extract).toHaveBeenCalledTimes(1);
    expect(result.tx).toBe("deadbeef");
    expect(result.psbt.toString("hex")).toBe("010203");

    await transport.close();
  });

  test("falls back to options.accountPath and does not finalize when finalizePsbt is false", async () => {
    mockPsbtVersion = 2;
    mockPsbtConfig.inputCount = 1;
    mockPsbtConfig.bip32DerivationPath = null;
    mockPsbtConfig.witnessUtxo = {
      scriptPubKey: makeScriptPubKeyP2pkh(),
    };

    jest.mocked(extract).mockReturnValue(Buffer.from("cafebabe", "hex"));

    const [client, transport] = await createClient();
    const btcNew = new BtcNew(client);

    const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), {
      finalizePsbt: false,
      accountPath: "m/44'/0'/0'",
      addressFormat: "legacy",
    });

    expect(finalize).not.toHaveBeenCalled();
    expect(extract).toHaveBeenCalledTimes(1);
    expect(result.tx).toBe("cafebabe");

    await transport.close();
  });

  // Tests for bip32Derivation auto-population (WalletConnect support)
  describe("BtcNew.signPsbtBuffer - bip32Derivation auto-population", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      getInputNonWitnessUtxoCalls = 0;
      getInputOutputIndexCalls = 0;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.outputCount = 0;
      mockPsbtConfig.witnessUtxo = undefined;
      mockPsbtConfig.nonWitnessUtxo = undefined;
      mockPsbtConfig.inputOutputIndex = undefined;
      mockPsbtConfig.redeemScript = undefined;
      mockPsbtConfig.bip32DerivationPath = null;
      mockPsbtConfig.outputs = [];
    });

    test("Phase 2: uses local derivation when no existing derivation and accountPath provided", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.bip32DerivationPath = null;
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2wpkh(),
      };

      jest.mocked(extract).mockReturnValue(Buffer.from("cafebabe", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      // With accountPath provided, should attempt local derivation
      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), {
        ...defaultSignOptions,
        accountPath: "m/84'/0'/0'",
      });

      expect(result.tx).toBe("cafebabe");
      await transport.close();
    });

    test("signs successfully when derivation has correct fingerprint", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 1;
      // Derivation with matching fingerprint (device returns [1,2,3,4])
      mockPsbtConfig.bip32DerivationPath = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2wpkh(),
      };

      jest.mocked(extract).mockReturnValue(Buffer.from("deadbeef", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), { ...defaultSignOptions });
      expect(result.tx).toBe("deadbeef");

      await transport.close();
    });

    test("uses accountPath for taproot address type", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.bip32DerivationPath = null;
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2tr(),
      };

      // Use valid hex string (not "taproot-tx" which is not valid hex)
      jest.mocked(extract).mockReturnValue(Buffer.from("aabbccdd", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), {
        accountPath: "m/86'/0'/0'",
        addressFormat: "bech32m",
      });

      expect(result.tx).toBe("aabbccdd");
      await transport.close();
    });

    test("uses accountPath for legacy address type", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.bip32DerivationPath = null;
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2pkh(),
      };

      // Use valid hex string (not "legacy-tx" which is not valid hex)
      jest.mocked(extract).mockReturnValue(Buffer.from("11223344", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), {
        accountPath: "m/44'/0'/0'",
        addressFormat: "legacy",
      });

      expect(result.tx).toBe("11223344");
      await transport.close();
    });

    test("reads scriptPubKey from nonWitnessUtxo when witnessUtxo is missing", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.bip32DerivationPath = null;
      mockPsbtConfig.witnessUtxo = undefined;
      mockPsbtConfig.inputOutputIndex = 1;
      mockPsbtConfig.nonWitnessUtxo = makeLegacyNonWitnessUtxo([
        makeScriptPubKeyP2pkh(),
        makeScriptPubKeyP2wpkh(),
      ]);

      jest.mocked(extract).mockReturnValue(Buffer.from("44556677", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), {
        ...defaultSignOptions,
        accountPath: "m/84'/0'/0'",
      });

      expect(result.tx).toBe("44556677");
      expect(getInputNonWitnessUtxoCalls).toBeGreaterThan(0);
      expect(getInputOutputIndexCalls).toBeGreaterThan(0);

      await transport.close();
    });

    test("does not throw when nonWitnessUtxo is malformed", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.bip32DerivationPath = null;
      mockPsbtConfig.witnessUtxo = undefined;
      mockPsbtConfig.inputOutputIndex = 0;
      mockPsbtConfig.nonWitnessUtxo = Buffer.from([0x00, 0x01]);

      jest.mocked(extract).mockReturnValue(Buffer.from("8899aabb", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), {
        ...defaultSignOptions,
        accountPath: "m/84'/0'/0'",
      });

      expect(result.tx).toBe("8899aabb");
      expect(getInputNonWitnessUtxoCalls).toBeGreaterThan(0);
      expect(getInputOutputIndexCalls).toBeGreaterThan(0);

      await transport.close();
    });
  });

  // Tests for output bip32Derivation auto-population (WalletConnect support)
  describe("BtcNew.signPsbtBuffer - output bip32Derivation auto-population", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      getInputNonWitnessUtxoCalls = 0;
      getInputOutputIndexCalls = 0;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.outputCount = 0;
      mockPsbtConfig.witnessUtxo = undefined;
      mockPsbtConfig.nonWitnessUtxo = undefined;
      mockPsbtConfig.inputOutputIndex = undefined;
      mockPsbtConfig.redeemScript = undefined;
      mockPsbtConfig.bip32DerivationPath = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      mockPsbtConfig.outputs = [];
    });

    test("signs successfully with outputs that have correct derivation fingerprint", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.outputCount = 2;
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2wpkh(),
      };
      mockPsbtConfig.outputs = [
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: [0x80000054, 0x80000000, 0x80000000, 1, 0],
          wrongFingerprint: false,
        },
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: null, // External output
        },
      ];

      jest.mocked(extract).mockReturnValue(Buffer.from("aabbccdd", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), { ...defaultSignOptions });
      expect(result.tx).toBe("aabbccdd");

      await transport.close();
    });

    test("signs with outputs that have wrong fingerprint (Phase 1 fix)", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.outputCount = 1;
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2wpkh(),
      };
      mockPsbtConfig.outputs = [
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: [0x80000054, 0x80000000, 0x80000000, 1, 0],
          wrongFingerprint: true,
        },
      ];

      jest.mocked(extract).mockReturnValue(Buffer.from("eeff0011", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      // Should attempt to fix output derivation fingerprint during Phase 1
      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), { ...defaultSignOptions });
      expect(result.tx).toBe("eeff0011");

      await transport.close();
    });

    test("signs with outputs that have no derivation (Phase 2 local scan)", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.outputCount = 2;
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2wpkh(),
      };
      mockPsbtConfig.outputs = [
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: null, // Missing derivation - should be populated via local scan
        },
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: null, // External output
        },
      ];

      jest.mocked(extract).mockReturnValue(Buffer.from("22334455", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      // Should attempt to populate output derivation during Phase 2 local scan
      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), { ...defaultSignOptions });
      expect(result.tx).toBe("22334455");

      await transport.close();
    });

    test("handles mixed inputs and outputs needing derivation population", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.outputCount = 2;
      mockPsbtConfig.bip32DerivationPath = null; // Input also needs derivation
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2wpkh(),
      };
      mockPsbtConfig.outputs = [
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: null, // Change output needs derivation
        },
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: null, // External output
        },
      ];

      jest.mocked(extract).mockReturnValue(Buffer.from("66778899", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      // Should populate both input and output derivations using local scan
      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), {
        ...defaultSignOptions,
        accountPath: "m/84'/0'/0'",
      });
      expect(result.tx).toBe("66778899");

      await transport.close();
    });

    test("handles taproot outputs needing derivation population", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.outputCount = 1;
      mockPsbtConfig.bip32DerivationPath = [0x80000056, 0x80000000, 0x80000000, 0, 0];
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2tr(),
      };
      mockPsbtConfig.outputs = [
        {
          scriptPubKey: makeScriptPubKeyP2tr(),
          bip32DerivationPath: null, // Taproot output needs derivation
        },
      ];

      jest.mocked(extract).mockReturnValue(Buffer.from("aabbccdd", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), {
        accountPath: "m/86'/0'/0'",
        addressFormat: "bech32m",
      });
      expect(result.tx).toBe("aabbccdd");

      await transport.close();
    });
  });

  // Tests for input/output consolidation - ensuring both are processed correctly in a single transaction
  describe("BtcNew.signPsbtBuffer - consolidation tests", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      getInputNonWitnessUtxoCalls = 0;
      getInputOutputIndexCalls = 0;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.outputCount = 0;
      mockPsbtConfig.witnessUtxo = undefined;
      mockPsbtConfig.nonWitnessUtxo = undefined;
      mockPsbtConfig.inputOutputIndex = undefined;
      mockPsbtConfig.redeemScript = undefined;
      mockPsbtConfig.bip32DerivationPath = null;
      mockPsbtConfig.outputs = [];
    });

    test("processes multiple inputs with multiple outputs correctly", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 3; // Multiple inputs
      mockPsbtConfig.outputCount = 2; // Multiple outputs (change + external)
      mockPsbtConfig.bip32DerivationPath = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2wpkh(),
      };
      mockPsbtConfig.outputs = [
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: [0x80000054, 0x80000000, 0x80000000, 1, 0], // Change output
          wrongFingerprint: false,
        },
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: null, // External output
        },
      ];

      jest.mocked(extract).mockReturnValue(Buffer.from("c0150114710101", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), { ...defaultSignOptions });
      expect(result.tx).toBe("c0150114710101");

      await transport.close();
    });

    test("handles inputs and outputs both needing derivation population", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 2;
      mockPsbtConfig.outputCount = 2;
      mockPsbtConfig.bip32DerivationPath = null; // Inputs need derivation
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2wpkh(),
      };
      mockPsbtConfig.outputs = [
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: null, // Change output needs derivation
        },
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: null, // External output
        },
      ];

      jest.mocked(extract).mockReturnValue(Buffer.from("b0711eeded01", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      // With accountPath provided, both inputs and outputs should get derivation
      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), {
        ...defaultSignOptions,
        accountPath: "m/84'/0'/0'",
      });
      expect(result.tx).toBe("b0711eeded01");

      await transport.close();
    });

    test("handles mixed derivation states (some with, some without)", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 2;
      mockPsbtConfig.outputCount = 3;
      mockPsbtConfig.bip32DerivationPath = [0x80000054, 0x80000000, 0x80000000, 0, 0]; // First input has derivation
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2wpkh(),
      };
      mockPsbtConfig.outputs = [
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: [0x80000054, 0x80000000, 0x80000000, 1, 0], // Has derivation
          wrongFingerprint: false,
        },
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: null, // Needs derivation
        },
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: null, // External
        },
      ];

      jest.mocked(extract).mockReturnValue(Buffer.from("1ed57a7e01", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), { ...defaultSignOptions });
      expect(result.tx).toBe("1ed57a7e01");

      await transport.close();
    });

    test("handles complex scenario with wrong fingerprints that need fixing", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.outputCount = 2;
      mockPsbtConfig.bip32DerivationPath = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2wpkh(),
      };
      mockPsbtConfig.outputs = [
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: [0x80000054, 0x80000000, 0x80000000, 1, 0],
          wrongFingerprint: true, // Needs fingerprint fix
        },
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: [0x80000054, 0x80000000, 0x80000000, 1, 1],
          wrongFingerprint: true, // Also needs fingerprint fix
        },
      ];

      jest.mocked(extract).mockReturnValue(Buffer.from("1f9f9010", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      // Should fix both outputs' fingerprints
      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), { ...defaultSignOptions });
      expect(result.tx).toBe("1f9f9010");

      await transport.close();
    });

    test("single input with many outputs (typical send scenario)", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.outputCount = 5; // Multiple external + change
      mockPsbtConfig.bip32DerivationPath = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2wpkh(),
      };
      mockPsbtConfig.outputs = [
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: null, // External
        },
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: null, // External
        },
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: null, // External
        },
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: null, // External
        },
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: [0x80000054, 0x80000000, 0x80000000, 1, 0], // Change
          wrongFingerprint: false,
        },
      ];

      jest.mocked(extract).mockReturnValue(Buffer.from("a1a00700575010", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), { ...defaultSignOptions });
      expect(result.tx).toBe("a1a00700575010");

      await transport.close();
    });

    test("many inputs with single output (consolidation/sweep scenario)", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 10; // Many inputs being consolidated
      mockPsbtConfig.outputCount = 1; // Single output (all to one address)
      mockPsbtConfig.bip32DerivationPath = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2wpkh(),
      };
      mockPsbtConfig.outputs = [
        {
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: [0x80000054, 0x80000000, 0x80000000, 0, 5], // Internal address
          wrongFingerprint: false,
        },
      ];

      jest.mocked(extract).mockReturnValue(Buffer.from("a1a115707510", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), { ...defaultSignOptions });
      expect(result.tx).toBe("a1a115707510");

      await transport.close();
    });

    test("mixed address types - legacy inputs with native segwit outputs", async () => {
      mockPsbtVersion = 2;
      mockPsbtConfig.inputCount = 1;
      mockPsbtConfig.outputCount = 2;
      // Legacy input
      mockPsbtConfig.bip32DerivationPath = [0x8000002c, 0x80000000, 0x80000000, 0, 0];
      mockPsbtConfig.witnessUtxo = {
        scriptPubKey: makeScriptPubKeyP2pkh(),
      };
      mockPsbtConfig.outputs = [
        {
          // Native segwit output
          scriptPubKey: makeScriptPubKeyP2wpkh(),
          bip32DerivationPath: null,
        },
        {
          // Legacy change output
          scriptPubKey: makeScriptPubKeyP2pkh(),
          bip32DerivationPath: [0x8000002c, 0x80000000, 0x80000000, 1, 0],
          wrongFingerprint: false,
        },
      ];

      jest.mocked(extract).mockReturnValue(Buffer.from("1ed7e501", "hex"));

      const [client, transport] = await createClient();
      const btcNew = new BtcNew(client);

      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), {
        accountPath: "m/44'/0'/0'",
        addressFormat: "legacy",
      });
      expect(result.tx).toBe("1ed7e501");

      await transport.close();
    });
  });
});
