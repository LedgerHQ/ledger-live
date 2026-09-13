import nearSigner, { createSigner } from "./signer";

const mockGetAddress = jest.fn();
const mockSignTransaction = jest.fn();

jest.mock("@ledgerhq/hw-app-near", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getAddress: mockGetAddress,
    signTransaction: mockSignTransaction,
  })),
}));

// Bypass the transport/device plumbing so the exported getAddress wrapper runs against a stub signer.
jest.mock("../../bridge/setup", () => ({
  executeWithSigner: () => (_deviceId: string, job: (signer: unknown) => unknown) =>
    job({ getAddress: mockGetAddress, signTransaction: mockSignTransaction }),
}));

const mockTransport = {} as any;

describe("near/signer createSigner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAddress", () => {
    it("passes boolean true directly as verify", async () => {
      mockGetAddress.mockResolvedValue({ address: "addr", publicKey: "pk" });
      const signer = createSigner(mockTransport);
      await signer.getAddress("44'/397'/0'/0'/0'", true);
      expect(mockGetAddress).toHaveBeenCalledWith("44'/397'/0'/0'/0'", true);
    });

    it("extracts verify from options object", async () => {
      mockGetAddress.mockResolvedValue({ address: "addr", publicKey: "pk" });
      const signer = createSigner(mockTransport);
      await signer.getAddress("44'/397'/0'/0'/0'", { verify: true });
      expect(mockGetAddress).toHaveBeenCalledWith("44'/397'/0'/0'/0'", true);
    });

    it("defaults verify to false when options is omitted", async () => {
      mockGetAddress.mockResolvedValue({ address: "addr", publicKey: "pk" });
      const signer = createSigner(mockTransport);
      await signer.getAddress("44'/397'/0'/0'/0'");
      expect(mockGetAddress).toHaveBeenCalledWith("44'/397'/0'/0'/0'", false);
    });

    it("defaults verify to false when options carries only unrelated properties (e.g. derivationMode)", async () => {
      mockGetAddress.mockResolvedValue({ address: "addr", publicKey: "pk" });
      const signer = createSigner(mockTransport);
      await signer.getAddress("44'/397'/0'/0'/0'", { derivationMode: "" });
      expect(mockGetAddress).toHaveBeenCalledWith("44'/397'/0'/0'/0'", false);
    });
  });

  describe("signTransaction", () => {
    it("decodes base64 before sending to device and returns hex signature", async () => {
      const rawSig = Buffer.from("deadbeef", "hex");
      mockSignTransaction.mockResolvedValue(rawSig);
      const signer = createSigner(mockTransport);

      const base64Tx = Buffer.from("rawbytes").toString("base64");
      const result = await signer.signTransaction("44'/397'/0'/0'/0'", base64Tx);

      expect(mockSignTransaction).toHaveBeenCalledWith(
        Buffer.from(base64Tx, "base64"),
        "44'/397'/0'/0'/0'",
      );
      expect(result).toBe("deadbeef");
    });

    it("throws when the device returns no signature", async () => {
      mockSignTransaction.mockResolvedValue(null);
      const signer = createSigner(mockTransport);
      await expect(
        signer.signTransaction("44'/397'/0'/0'/0'", Buffer.from("tx").toString("base64")),
      ).rejects.toThrow("Near: no signature returned from device");
    });
  });
});

describe("near/signer default export getAddress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns address, publicKey and the requested path", async () => {
    mockGetAddress.mockResolvedValue({ address: "alice.near", publicKey: "ed25519:pk" });

    const result = await nearSigner.getAddress("device-1", {
      path: "44'/397'/0'/0'/0'",
      verify: true,
    } as any);

    expect(mockGetAddress).toHaveBeenCalledWith("44'/397'/0'/0'/0'", true);
    expect(result).toEqual({
      address: "alice.near",
      publicKey: "ed25519:pk",
      path: "44'/397'/0'/0'/0'",
    });
  });

  it("defaults verify to false when the caller omits it", async () => {
    mockGetAddress.mockResolvedValue({ address: "alice.near", publicKey: "ed25519:pk" });

    await nearSigner.getAddress("device-1", { path: "44'/397'/0'/0'/0'" } as any);

    expect(mockGetAddress).toHaveBeenCalledWith("44'/397'/0'/0'/0'", false);
  });
});
