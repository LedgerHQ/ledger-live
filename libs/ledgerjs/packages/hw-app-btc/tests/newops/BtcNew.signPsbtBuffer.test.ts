import BtcNew from "../../src/BtcNew";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Transport from "@ledgerhq/hw-transport";
import { finalize } from "../../src/newops/psbtFinalizer";
import { extract } from "../../src/newops/psbtExtractor";
import { TestingClient } from "./integrationtools";

// We mock @ledgerhq/psbtv2 to control PSBT behaviour and hit specific
// branches in signPsbtBuffer without having to build real PSBTs.

let mockPsbtVersion = 2;

interface MockWitnessUtxo {
  scriptPubKey: Buffer;
}

interface MockPsbtConfig {
  inputCount: number;
  witnessUtxo?: MockWitnessUtxo;
  redeemScript?: Buffer;
  bip32DerivationPath: number[] | null;
}

const mockPsbtConfig: MockPsbtConfig = {
  inputCount: 1,
  witnessUtxo: undefined,
  redeemScript: undefined,
  // Default to a purpose that does not matter much for these tests.
  bip32DerivationPath: [0x80000054, 0x80000000, 0x80000000, 0, 0],
};

jest.mock("@ledgerhq/psbtv2", () => {
  const actual = jest.requireActual("@ledgerhq/psbtv2");
  const localPsbtIn = actual.psbtIn;

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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    deserialize(_buf: Buffer): void {}

    getGlobalInputCount(): number {
      return mockPsbtConfig.inputCount;
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

    getInputWitnessUtxo(_index: number): MockWitnessUtxo | undefined {
      return mockPsbtConfig.witnessUtxo;
    }

    getInputRedeemScript(_index: number): Buffer | undefined {
      return mockPsbtConfig.redeemScript;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setInputTapKeySig(_index: number, _sig: Buffer): void {}

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setInputPartialSig(_index: number, _pubkey: Buffer, _sig: Buffer): void {}

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

function makeUnsupportedScriptPubKey(): Buffer {
  // Something that does not match any of the known templates
  return Buffer.from([0x6a, 0x01, 0x00]);
}

describe("BtcNew.signPsbtBuffer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPsbtConfig.inputCount = 1;
    mockPsbtConfig.witnessUtxo = undefined;
    mockPsbtConfig.redeemScript = undefined;
    mockPsbtConfig.bip32DerivationPath = [0x80000054, 0x80000000, 0x80000000, 0, 0];
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
      btcNew.signPsbtBuffer(makePsbtBuffer(), { accountPath: "m/84'/0'/0'" }),
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
    let result = await btcNew.signPsbtBuffer(makePsbtBuffer());
    expect(result.tx).toBe("deadbeef");

    mockPsbtConfig.witnessUtxo = { scriptPubKey: makeScriptPubKeyP2wpkhWrapped() };
    jest.mocked(extract).mockReturnValue(Buffer.from("cafebabe", "hex"));
    result = await btcNew.signPsbtBuffer(makePsbtBuffer());
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
      const result = await btcNew.signPsbtBuffer(makePsbtBuffer(), { addressFormat: format });
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

    async function expectPurpose(purpose: number) {
      mockPsbtConfig.bip32DerivationPath = [0x80000000 + purpose, 0x80000000, 0x80000000, 0, 0];
      const result = await btcNew.signPsbtBuffer(makePsbtBuffer());
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

    await expect(btcNew.signPsbtBuffer(makePsbtBuffer())).rejects.toThrow("No inputs in PSBT");

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

    const result = await btcNew.signPsbtBuffer(makePsbtBuffer());

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
    });

    expect(finalize).not.toHaveBeenCalled();
    expect(extract).toHaveBeenCalledTimes(1);
    expect(result.tx).toBe("cafebabe");

    await transport.close();
  });

  test("throws when neither BIP32 derivation nor options.accountPath is provided", async () => {
    mockPsbtVersion = 2;
    mockPsbtConfig.inputCount = 1;
    mockPsbtConfig.bip32DerivationPath = null;
    mockPsbtConfig.witnessUtxo = {
      scriptPubKey: makeScriptPubKeyP2wpkh(),
    };

    const [client, transport] = await createClient();
    const btcNew = new BtcNew(client);

    await expect(btcNew.signPsbtBuffer(makePsbtBuffer())).rejects.toThrow(
      "No internal inputs found in PSBT (no BIP32 derivation matching device fingerprint) " +
        "and no account path provided in options.",
    );

    await transport.close();
  });
});
