import { createSignerStellar } from "./signer";
import Stellar from "@ledgerhq/hw-app-str";
import Transport from "@ledgerhq/hw-transport";

jest.mock("@ledgerhq/hw-app-str");
jest.mock("../../../../families/stellar/getAddress", () => jest.fn());

const MockedStellar = Stellar as jest.MockedClass<typeof Stellar>;
const mockTransport = {} as Transport;

describe("createSignerStellar", () => {
  let mockGetPublicKey: jest.Mock;
  let mockSignTransaction: jest.Mock;

  beforeEach(() => {
    // 32 bytes — valid Ed25519 raw public key
    mockGetPublicKey = jest.fn().mockResolvedValue({ rawPublicKey: Buffer.alloc(32, 0x01) });
    mockSignTransaction = jest.fn();
    MockedStellar.mockImplementation(
      () =>
        ({
          getPublicKey: mockGetPublicKey,
          signTransaction: mockSignTransaction,
        }) as unknown as Stellar,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAddress — display flag forwarded to hw-app-str", () => {
    it("should NOT display address on device when called without options", async () => {
      const signer = createSignerStellar(mockTransport);

      await signer.getAddress("44'/148'/0'");

      expect(mockGetPublicKey).toHaveBeenCalledWith("44'/148'/0'", false);
    });

    it("should NOT display address on device when called with verify: false", async () => {
      const signer = createSignerStellar(mockTransport);

      await signer.getAddress("44'/148'/0'", { verify: false });

      expect(mockGetPublicKey).toHaveBeenCalledWith("44'/148'/0'", false);
    });

    it("should display address on device when called with boolean true (receive flow)", async () => {
      const signer = createSignerStellar(mockTransport);

      await signer.getAddress("44'/148'/0'", true);

      expect(mockGetPublicKey).toHaveBeenCalledWith("44'/148'/0'", true);
    });

    it("should display address on device when called with verify: true", async () => {
      const signer = createSignerStellar(mockTransport);

      await signer.getAddress("44'/148'/0'", { verify: true });

      expect(mockGetPublicKey).toHaveBeenCalledWith("44'/148'/0'", true);
    });
  });

  describe("getAddress — return value", () => {
    it("should return a Base58-encoded Stellar address starting with G", async () => {
      const signer = createSignerStellar(mockTransport);

      const result = await signer.getAddress("44'/148'/0'");

      expect(result.address).toMatch(/^G/);
      expect(result.publicKey).toMatch(/^G/);
      expect(result.path).toBe("44'/148'/0'");
    });

    it("should return the same value for address and publicKey", async () => {
      const signer = createSignerStellar(mockTransport);

      const result = await signer.getAddress("44'/148'/0'");

      expect(result.address).toBe(result.publicKey);
    });
  });
});
