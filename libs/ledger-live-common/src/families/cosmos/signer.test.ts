import { ExpertModeRequired } from "@ledgerhq/coin-cosmos/errors";
import { RETURN_CODES } from "@ledgerhq/coin-cosmos/types/index";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import Transport from "@ledgerhq/hw-transport";
import { DmkSignerCosmos, LegacySignerCosmos } from "@ledgerhq/live-signer-cosmos";
import { getSigner } from "../../bridge/generic-coin-framework/signer";
import cosmosSigner, { createSigner } from "./signer";
import { setCosmosLdmkEnabled } from "./setup";

jest.mock("@ledgerhq/live-signer-cosmos", () => ({
  LegacySignerCosmos: jest.fn(),
  DmkSignerCosmos: jest.fn(),
}));

const MockedLegacy = LegacySignerCosmos as jest.MockedClass<typeof LegacySignerCosmos>;
const MockedDmk = DmkSignerCosmos as jest.MockedClass<typeof DmkSignerCosmos>;

const compressedPk = Buffer.from(`02${"11".repeat(32)}`, "hex");
const publicKeyHex = compressedPk.toString("hex");
const publicKeyBase64 = compressedPk.toString("base64");
const address = "cosmos1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqnrql8a";
const PATH = "44'/118'/0'/0/0";
const INJ_PATH = "44'/60'/0'/0/0";

function encodeInt(n: Buffer): Buffer {
  const encoded = n[0] & 0x80 ? Buffer.concat([Buffer.from([0x00]), n]) : n;
  return Buffer.concat([Buffer.from([0x02, encoded.length]), encoded]);
}

function buildDer(r: Buffer, s: Buffer): Buffer {
  const inner = Buffer.concat([encodeInt(r), encodeInt(s)]);
  return Buffer.concat([Buffer.from([0x30, inner.length]), inner]);
}

const r = Buffer.alloc(32, 0x11);
const s = Buffer.alloc(32, 0x22);
const derSignature = buildDer(r, s);
const expectedSigHex = r.toString("hex") + s.toString("hex");

describe("cosmos signer adapter", () => {
  let mockGetAddress: jest.Mock;
  let mockSign: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setCosmosLdmkEnabled(false);
    mockGetAddress = jest.fn().mockResolvedValue({ address, publicKey: publicKeyHex });
    mockSign = jest.fn().mockResolvedValue({ signature: derSignature, return_code: 0x9000 });
    MockedLegacy.mockImplementation(
      () =>
        ({
          getAddress: mockGetAddress,
          sign: mockSign,
          getAddressAndPubKey: jest.fn(),
        }) as unknown as LegacySignerCosmos,
    );
    MockedDmk.mockImplementation(
      () =>
        ({
          getAddress: mockGetAddress,
          sign: mockSign,
          getAddressAndPubKey: jest.fn(),
        }) as unknown as DmkSignerCosmos,
    );
  });

  afterAll(() => setCosmosLdmkEnabled(false));

  describe("getAddress", () => {
    it("keeps the hex public key and real address when the resolver passes a positional HRP", async () => {
      const signer = createSigner({} as Transport);
      const result = await signer.getAddress(PATH, "osmo", false);

      expect(mockGetAddress).toHaveBeenCalledWith(PATH, "osmo", false);
      expect(result).toEqual({ path: PATH, address, publicKey: publicKeyHex });
    });

    it("encodes the public key as base64 for combine when the framework passes an options object", async () => {
      const signer = createSigner({} as Transport);
      const result = await signer.getAddress(PATH, { hrp: "cosmos", derivationMode: "" });

      expect(mockGetAddress).toHaveBeenCalledWith(PATH, "cosmos", false);
      expect(result.address).toBe(address);
      expect(result.publicKey).toBe(publicKeyBase64);
    });

    it("does not ask the device to confirm the address during signing", async () => {
      const signer = createSigner({} as Transport);
      await signer.getAddress(PATH, { hrp: "cosmos", derivationMode: "" });

      expect(mockGetAddress).toHaveBeenCalledWith(PATH, "cosmos", false);
    });

    it("still verifies on device when receive asks for it", async () => {
      const signer = createSigner({} as Transport);
      await signer.getAddress(PATH, "cosmos", true);

      expect(mockGetAddress).toHaveBeenCalledWith(PATH, "cosmos", true);
    });

    it("honours verify:true on the options object", async () => {
      const signer = createSigner({} as Transport);
      await signer.getAddress(PATH, { hrp: "inj", verify: true });

      expect(mockGetAddress).toHaveBeenCalledWith(PATH, "inj", true);
    });
  });

  describe("signTransaction", () => {
    const amino = Buffer.from("sign-doc-bytes");
    const message = JSON.stringify({
      signable: amino.toString("base64"),
      protoMsgs: ["must-not-reach-the-device"],
    });

    it("sends only the signable bytes to the device and returns a 128-char hex signature", async () => {
      const signer = createSigner({} as Transport);
      const sig = await signer.signTransaction(PATH, message, {
        hrp: "cosmos",
        signWithPrefix: true,
      });

      expect(mockSign).toHaveBeenCalledWith([44, 118, 0, 0, 0], amino, "cosmos");
      expect(sig).toBe(expectedSigHex);
      expect(sig).toMatch(/^[0-9a-fA-F]{128}$/);
    });

    it("matches the legacy path's signature and pubkey encoding byte-for-byte", async () => {
      const signer = createSigner({} as Transport);
      const [addr, sig] = await Promise.all([
        signer.getAddress(PATH, { hrp: "cosmos" }),
        signer.signTransaction(PATH, message, { hrp: "cosmos", signWithPrefix: true }),
      ]);

      expect(addr.publicKey).toBe(Buffer.from(publicKeyHex, "hex").toString("base64"));
      expect(sig).toBe(expectedSigHex);
    });

    it("forwards injective's prefix as the third sign argument", async () => {
      const signer = createSigner({} as Transport);
      await signer.signTransaction(INJ_PATH, message, { hrp: "inj", signWithPrefix: true });

      expect(mockSign).toHaveBeenCalledWith([44, 60, 0, 0, 0], amino, "inj");
    });

    it("omits the prefix for crypto_org, whose device app is not app-cosmos", async () => {
      const signer = createSigner({} as Transport);
      await signer.signTransaction("44'/394'/0'/0/0", message, {
        hrp: "cro",
        signWithPrefix: false,
      });

      expect(mockSign).toHaveBeenCalledWith([44, 394, 0, 0, 0], amino, undefined);
    });

    it("throws UserRefusedOnDevice when the user rejects on the signing path", async () => {
      mockSign.mockResolvedValue({
        signature: null,
        return_code: RETURN_CODES.REFUSED_OPERATION,
      });
      const signer = createSigner({} as Transport);

      await expect(signer.signTransaction(PATH, message, { hrp: "cosmos" })).rejects.toBeInstanceOf(
        UserRefusedOnDevice,
      );
    });

    it("throws ExpertModeRequired when the device demands expert mode on the signing path", async () => {
      mockSign.mockResolvedValue({
        signature: null,
        return_code: RETURN_CODES.EXPERT_MODE_REQUIRED,
      });
      const signer = createSigner({} as Transport);

      await expect(signer.signTransaction(PATH, message, { hrp: "cosmos" })).rejects.toBeInstanceOf(
        ExpertModeRequired,
      );
    });
  });
});

describe("cosmos signer registration", () => {
  it("resolves through getSigner so the generic coin framework can reach it", async () => {
    await expect(getSigner("cosmos")).resolves.toBe(cosmosSigner);
  });
});
