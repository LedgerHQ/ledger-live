import Tezos from "@ledgerhq/hw-app-tezos";
import type Transport from "@ledgerhq/hw-transport";
import { convertSecp256k1DERToRaw, createSignerTezos, normalizeTo32Bytes } from "./signer";

jest.mock("@ledgerhq/hw-app-tezos", () => ({
  __esModule: true,
  default: jest.fn(),
  TezosCurves: {
    ED25519: 0,
    SECP256K1: 1,
    SECP256R1: 2,
  },
}));

const MockedTezos = jest.mocked(Tezos);
const mockTransport: Transport = Object.create(null);

// DER encoding helpers
function buildDer(r: Buffer, s: Buffer): string {
  const rEncoded = r[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), r]) : r;
  const sEncoded = s[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), s]) : s;
  const inner = Buffer.concat([
    Buffer.from([0x02, rEncoded.length]),
    rEncoded,
    Buffer.from([0x02, sEncoded.length]),
    sEncoded,
  ]);
  return Buffer.concat([Buffer.from([0x30, inner.length]), inner]).toString("hex");
}

describe("normalizeTo32Bytes", () => {
  it("should strip the leading 0x00 from a 33-byte buffer", () => {
    const payload = Buffer.alloc(31, 0xab);
    const input = Buffer.concat([Buffer.from([0x00]), payload]);
    expect(input.length).toBe(32);
    const padded33 = Buffer.concat([Buffer.from([0x00]), Buffer.alloc(32, 0xab)]);
    const result = normalizeTo32Bytes(padded33);
    expect(result.length).toBe(32);
    expect(result[0]).toBe(0xab);
  });

  it("should left-pad a short buffer to 32 bytes", () => {
    const short = Buffer.from([0x01, 0x02, 0x03]);
    const result = normalizeTo32Bytes(short);
    expect(result.length).toBe(32);
    expect(result[29]).toBe(0x01);
    expect(result[30]).toBe(0x02);
    expect(result[31]).toBe(0x03);
    expect(result[0]).toBe(0x00);
  });

  it("should return a 32-byte buffer unchanged", () => {
    const exact = Buffer.alloc(32, 0xff);
    const result = normalizeTo32Bytes(exact);
    expect(result.length).toBe(32);
    expect(result).toEqual(exact);
  });
});

describe("convertSecp256k1DERToRaw", () => {
  const r32 = Buffer.alloc(32, 0xaa);
  const s32 = Buffer.alloc(32, 0xbb);

  it("should pass through a hex string that is already 64 bytes (128 hex chars)", () => {
    const raw64 = Buffer.alloc(64, 0xcc).toString("hex");
    expect(convertSecp256k1DERToRaw(raw64)).toBe(raw64);
  });

  it("should decode a standard DER signature with 32-byte r and s", () => {
    const der = buildDer(r32, s32);
    const result = convertSecp256k1DERToRaw(der);
    expect(result).toBe(r32.toString("hex") + s32.toString("hex"));
    expect(result.length).toBe(128);
  });

  it("should strip the DER leading 0x00 from r when r is 33 bytes", () => {
    // r has high bit set → DER encoding prepends 0x00
    const rHigh = Buffer.alloc(32, 0xfe); // 0xfe has high bit set
    const der = buildDer(rHigh, s32);
    const result = convertSecp256k1DERToRaw(der);
    expect(result).toBe(rHigh.toString("hex") + s32.toString("hex"));
    expect(result.length).toBe(128);
  });

  it("should strip the DER leading 0x00 from s when s is 33 bytes", () => {
    const sHigh = Buffer.alloc(32, 0xfe);
    const der = buildDer(r32, sHigh);
    const result = convertSecp256k1DERToRaw(der);
    expect(result).toBe(r32.toString("hex") + sHigh.toString("hex"));
    expect(result.length).toBe(128);
  });

  it("should left-pad r to 32 bytes when r is shorter than 32 bytes", () => {
    const rShort = Buffer.from([0x01, 0x02]); // only 2 bytes
    const der = buildDer(rShort, s32);
    const result = convertSecp256k1DERToRaw(der);
    const expectedR = Buffer.alloc(32, 0);
    rShort.copy(expectedR, 30);
    expect(result).toBe(expectedR.toString("hex") + s32.toString("hex"));
    expect(result.length).toBe(128);
  });

  it("should left-pad s to 32 bytes when s is shorter than 32 bytes", () => {
    const sShort = Buffer.from([0x03]);
    const der = buildDer(r32, sShort);
    const result = convertSecp256k1DERToRaw(der);
    const expectedS = Buffer.alloc(32, 0);
    sShort.copy(expectedS, 31);
    expect(result).toBe(r32.toString("hex") + expectedS.toString("hex"));
    expect(result.length).toBe(128);
  });
});

describe("createSignerTezos", () => {
  let mockGetAddress: jest.Mock;
  let mockSignOperation: jest.Mock;

  beforeEach(() => {
    mockGetAddress = jest.fn().mockResolvedValue({
      address: "tz1VUmqS38E45KZevtphpVF4cKiK1YJ1P9eL",
      publicKey: "edpkuidtssPLLHKZCo9uKDGy4nnXKeBn1Kv5h4DdWZ3d8G5tcUBy4B",
    });
    mockSignOperation = jest.fn().mockResolvedValue({
      signature: Buffer.alloc(64, 0xcc).toString("hex"),
    });
    MockedTezos.mockImplementation(() => {
      const tezos = Object.create(Tezos.prototype);
      tezos.getAddress = mockGetAddress;
      tezos.signOperation = mockSignOperation;
      return tezos;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("gets an ED25519 address from hw-app-tezos by default", async () => {
    const signer = createSignerTezos(mockTransport);

    await expect(signer.getAddress("44'/1729'/0'/0'")).resolves.toEqual({
      address: "tz1VUmqS38E45KZevtphpVF4cKiK1YJ1P9eL",
      publicKey: "edpkuidtssPLLHKZCo9uKDGy4nnXKeBn1Kv5h4DdWZ3d8G5tcUBy4B",
    });

    expect(mockGetAddress).toHaveBeenCalledWith("44'/1729'/0'/0'", { verify: false, curve: 0 });
  });

  it("forwards verify and SECP256K1 curve for tezosSecp256k1 derivation", async () => {
    const signer = createSignerTezos(mockTransport);

    await signer.getAddress("44'/1729'/0'", { verify: true, derivationMode: "tezosSecp256k1" });

    expect(mockGetAddress).toHaveBeenCalledWith("44'/1729'/0'", { verify: true, curve: 1 });
  });

  it("should normalize hex public keys returned by hw-app-tezos", async () => {
    mockGetAddress.mockResolvedValueOnce({
      address: "tz2F4XnSd1wjwWsthemvZQjoPER7NVSt35k3",
      publicKey: "03576c19462a7d0cc3d121b1b00e92258b5f71d643c99a599fc1683f03abb7a1c2",
    });
    const signer = createSignerTezos(mockTransport);

    await expect(
      signer.getAddress("44'/1729'/0'", { derivationMode: "tezosSecp256k1" }),
    ).resolves.toEqual({
      address: "tz2F4XnSd1wjwWsthemvZQjoPER7NVSt35k3",
      publicKey: "sppk7but7h93Ws1XhAPvdBcttVmoBDGHxdpaU8dPy5549f3eLJFAjag",
    });
  });

  it("should reject unsupported derivation modes instead of falling back to ED25519", async () => {
    const signer = createSignerTezos(mockTransport);

    await expect(signer.getAddress("44'/1729'/0'", { derivationMode: "ethM" })).rejects.toThrow(
      "Unsupported Tezos derivation mode: ethM",
    );
  });

  it("signs operations with the matching Tezos curve", async () => {
    const signer = createSignerTezos(mockTransport);

    await expect(
      signer.signTransaction("44'/1729'/0'", "deadbeef", { derivationMode: "tezosSecp256k1" }),
    ).resolves.toBe(Buffer.alloc(64, 0xcc).toString("hex"));

    expect(mockSignOperation).toHaveBeenCalledWith("44'/1729'/0'", "deadbeef", { curve: 1 });
  });
});
