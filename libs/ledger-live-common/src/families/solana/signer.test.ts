import bs58 from "bs58";
import { createSigner, solanaGetAddress } from "./signer";

jest.mock("@ledgerhq/live-signer-solana");
jest.mock("../../hw/dmkUtils");

import { LegacySignerSolana, DmkSignerSol } from "@ledgerhq/live-signer-solana";
import { isDmkTransport } from "../../hw/dmkUtils";
import Transport from "@ledgerhq/hw-transport";
import { VersionedTransaction } from "@solana/web3.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { setSolanaLdmkEnabled } from "./setup";

const MockedLegacySignerSolana = LegacySignerSolana as jest.MockedClass<typeof LegacySignerSolana>;
const MockedDmkSignerSol = DmkSignerSol as jest.MockedClass<typeof DmkSignerSol>;
const mockedIsDmkTransport = isDmkTransport as jest.MockedFunction<typeof isDmkTransport>;
const mockTransport = {} as Transport;

const CRAFTED_TX_BASE64 =
  "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDNzWs4isgmR+LEHY8ZcgBBLMnC4ckD1iuhSa2/Y+69I91oyGFaAZ/9w4srgx9KoqiHtPM6Vur7h4D6XVoSgrEhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALt5JNk+MAN8BXYrlkxMEL1C/sM3+ZFYwZw4eofBOKp4BAgIAAQwCAAAAgJaYAAAAAAA=";
const CRAFTED_MESSAGE = Buffer.from(
  VersionedTransaction.deserialize(Buffer.from(CRAFTED_TX_BASE64, "base64")).message.serialize(),
);

describe("createSigner", () => {
  let mockGetAddress: jest.Mock;
  let mockSignTransaction: jest.Mock;

  beforeEach(() => {
    mockGetAddress = jest.fn();
    mockSignTransaction = jest.fn();
    mockedIsDmkTransport.mockReturnValue(false);
    MockedLegacySignerSolana.mockImplementation(
      () =>
        ({
          getAddress: mockGetAddress,
          signTransaction: mockSignTransaction,
        }) as unknown as LegacySignerSolana,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("legacy transport", () => {
    describe("getAddress", () => {
      it("returns the address and its base58 public key, without asking to display it", async () => {
        const addressBuffer = Buffer.from("deadbeef", "hex");
        mockGetAddress.mockResolvedValue({ address: addressBuffer });

        const signer = createSigner(mockTransport);
        const result = await signer.getAddress("44'/501'/0'/0'");

        expect(MockedLegacySignerSolana).toHaveBeenCalledWith(mockTransport);
        expect(mockGetAddress).toHaveBeenCalledWith("44'/501'/0'/0'", false);
        expect(result).toEqual({ address: addressBuffer, publicKey: bs58.encode(addressBuffer) });
      });

      it("forwards the verify flag to the signer", async () => {
        const addressBuffer = Buffer.from("cafebabe", "hex");
        mockGetAddress.mockResolvedValue({ address: addressBuffer });

        const signer = createSigner(mockTransport);
        await signer.getAddress("44'/501'/0'/0'", true);

        expect(mockGetAddress).toHaveBeenCalledWith("44'/501'/0'/0'", true);
      });

      it("does not display the address when handed the framework's options object", async () => {
        const addressBuffer = Buffer.from("cafebabe", "hex");
        mockGetAddress.mockResolvedValue({ address: addressBuffer });

        const signer = createSigner(mockTransport);
        await signer.getAddress("44'/501'/0'/0'", { derivationMode: "solanaMain" });

        expect(mockGetAddress).toHaveBeenCalledWith("44'/501'/0'/0'", false);
      });
    });

    describe("signTransaction", () => {
      it("decodes base64 tx, calls signer with Buffer, returns hex signature", async () => {
        const signatureBuffer = Buffer.from("aabbcc", "hex");
        mockSignTransaction.mockResolvedValue({ signature: signatureBuffer });

        const signer = createSigner(mockTransport);
        const txBase64 = CRAFTED_TX_BASE64;
        const result = await signer.signTransaction("44'/501'/0'/0'", txBase64);

        expect(mockSignTransaction).toHaveBeenCalledWith(
          "44'/501'/0'/0'",
          CRAFTED_MESSAGE,
          undefined,
        );
        expect(result).toBe("aabbcc");
      });

      it("drops the resolution the legacy signer cannot honour", async () => {
        mockSignTransaction.mockResolvedValue({ signature: Buffer.from("aabbcc", "hex") });

        const signer = createSigner(mockTransport);
        const txBase64 = CRAFTED_TX_BASE64;
        await signer.signTransaction("44'/501'/0'/0'", txBase64, { templateId: "swap-template" });

        expect(mockSignTransaction).toHaveBeenCalledWith(
          "44'/501'/0'/0'",
          CRAFTED_MESSAGE,
          undefined,
        );
      });
    });
  });

  describe("DMK transport", () => {
    const mockDmk = Object.create(DeviceManagementKit.prototype) as DeviceManagementKit;
    const mockSessionId = "test-session-id";
    const dmkTransport = {
      dmk: mockDmk,
      sessionId: mockSessionId,
    } as unknown as Transport & { dmk: DeviceManagementKit; sessionId: string };

    afterEach(() => {
      setSolanaLdmkEnabled(false);
    });

    beforeEach(() => {
      setSolanaLdmkEnabled(true);
      mockedIsDmkTransport.mockReturnValue(true);
      MockedDmkSignerSol.mockImplementation(
        () =>
          ({
            getAddress: mockGetAddress,
            signTransaction: mockSignTransaction,
          }) as unknown as DmkSignerSol,
      );
    });

    it("creates a DmkSignerSol when transport is DMK", () => {
      createSigner(dmkTransport);
      expect(MockedDmkSignerSol).toHaveBeenCalledWith(mockDmk, mockSessionId, {
        transactionChecks: false,
      });
    });

    it("falls back to the legacy signer while the ldmkSolanaSigner flag is off", () => {
      setSolanaLdmkEnabled(false);

      createSigner(dmkTransport);

      expect(MockedDmkSignerSol).not.toHaveBeenCalled();
      expect(MockedLegacySignerSolana).toHaveBeenCalledWith(dmkTransport);
    });

    it("delegates getAddress to the DMK signer", async () => {
      const addressBuffer = Buffer.from("deadbeef", "hex");
      mockGetAddress.mockResolvedValue({ address: addressBuffer });

      const signer = createSigner(dmkTransport);
      const result = await signer.getAddress("44'/501'/0'/0'");

      expect(result).toEqual({ address: addressBuffer, publicKey: bs58.encode(addressBuffer) });
    });

    it("delegates signTransaction to the DMK signer", async () => {
      const signatureBuffer = Buffer.from("aabbcc", "hex");
      mockSignTransaction.mockResolvedValue({ signature: signatureBuffer });

      const signer = createSigner(dmkTransport);
      const txBase64 = CRAFTED_TX_BASE64;
      const result = await signer.signTransaction("44'/501'/0'/0'", txBase64);

      expect(result).toBe("aabbcc");
    });

    it("forwards the resolution so a swap is clear-signed as one", async () => {
      mockSignTransaction.mockResolvedValue({ signature: Buffer.from("aabbcc", "hex") });

      const signer = createSigner(dmkTransport);
      const txBase64 = CRAFTED_TX_BASE64;
      await signer.signTransaction("44'/501'/0'/0'", txBase64, { templateId: "swap-template" });

      expect(mockSignTransaction).toHaveBeenCalledWith("44'/501'/0'/0'", CRAFTED_MESSAGE, {
        templateId: "swap-template",
      });
    });
  });
});

describe("solanaGetAddress", () => {
  it("bs58-encodes the address buffer and returns { address, publicKey, path }", async () => {
    const addressBuffer = Buffer.from([1, 2, 3, 4, 5]);
    const expectedPublicKey = bs58.encode(addressBuffer);

    const signerContext = jest.fn().mockImplementation((_deviceId, fn) => {
      return fn({ getAddress: async () => ({ address: addressBuffer }) });
    });

    const getAddress = solanaGetAddress(signerContext);
    const result = await getAddress("device-1", {
      path: "44'/501'/0'/0'",
      verify: false,
      currency: getCryptoCurrencyById("solana"),
      derivationMode: "solanaMain",
    });

    expect(result).toEqual({
      address: expectedPublicKey,
      publicKey: expectedPublicKey,
      path: "44'/501'/0'/0'",
    });
  });

  it("passes deviceId and path/verify through signerContext", async () => {
    const addressBuffer = Buffer.alloc(32, 0xab);
    const signerContext = jest.fn().mockImplementation((_deviceId, fn) => {
      return fn({ getAddress: async () => ({ address: addressBuffer }) });
    });

    const getAddress = solanaGetAddress(signerContext);
    await getAddress("my-device", {
      path: "44'/501'/1'/0'",
      verify: true,
      currency: getCryptoCurrencyById("solana"),
      derivationMode: "solanaMain",
    });

    expect(signerContext).toHaveBeenCalledWith("my-device", expect.any(Function));
  });
});
