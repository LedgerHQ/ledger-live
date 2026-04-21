import bs58 from "bs58";
import { createSigner, solanaGetAddress } from "../../loaders/solana";

jest.mock("@ledgerhq/live-signer-solana");
jest.mock("../../../../hw/dmkUtils");

import { LegacySignerSolana, DmkSignerSol } from "@ledgerhq/live-signer-solana";
import { isDmkTransport } from "../../../../hw/dmkUtils";
import Transport from "@ledgerhq/hw-transport";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";

const MockedLegacySignerSolana = LegacySignerSolana as jest.MockedClass<typeof LegacySignerSolana>;
const MockedDmkSignerSol = DmkSignerSol as jest.MockedClass<typeof DmkSignerSol>;
const mockedIsDmkTransport = isDmkTransport as jest.MockedFunction<typeof isDmkTransport>;
const mockTransport = {} as Transport;

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
      it("returns { address: Buffer } from the legacy signer", async () => {
        const addressBuffer = Buffer.from("deadbeef", "hex");
        mockGetAddress.mockResolvedValue({ address: addressBuffer });

        const signer = createSigner(mockTransport);
        const result = await signer.getAddress("44'/501'/0'/0'");

        expect(MockedLegacySignerSolana).toHaveBeenCalledWith(mockTransport);
        expect(mockGetAddress).toHaveBeenCalledWith("44'/501'/0'/0'");
        expect(result).toEqual({ address: addressBuffer });
      });

      it("forwards the verify flag to the signer", async () => {
        const addressBuffer = Buffer.from("cafebabe", "hex");
        mockGetAddress.mockResolvedValue({ address: addressBuffer });

        const signer = createSigner(mockTransport);
        await signer.getAddress("44'/501'/0'/0'", true);

        expect(mockGetAddress).toHaveBeenCalledWith("44'/501'/0'/0'", true);
      });
    });

    describe("signTransaction", () => {
      it("decodes base64 tx, calls signer with Buffer, returns hex signature", async () => {
        const signatureBuffer = Buffer.from("aabbcc", "hex");
        mockSignTransaction.mockResolvedValue({ signature: signatureBuffer });

        const signer = createSigner(mockTransport);
        const txBase64 = Buffer.from("fake transaction bytes").toString("base64");
        const result = await signer.signTransaction("44'/501'/0'/0'", txBase64);

        expect(mockSignTransaction).toHaveBeenCalledWith(
          "44'/501'/0'/0'",
          Buffer.from(txBase64, "base64"),
        );
        expect(result).toBe("aabbcc");
      });
    });
  });

  describe("DMK transport", () => {
    const mockDmk = {} as DeviceManagementKit;
    const mockSessionId = "test-session-id";
    const dmkTransport = {
      dmk: mockDmk,
      sessionId: mockSessionId,
    } as unknown as Transport & { dmk: DeviceManagementKit; sessionId: string };

    beforeEach(() => {
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
      expect(MockedDmkSignerSol).toHaveBeenCalledWith(mockDmk, mockSessionId);
    });

    it("delegates getAddress to the DMK signer", async () => {
      const addressBuffer = Buffer.from("deadbeef", "hex");
      mockGetAddress.mockResolvedValue({ address: addressBuffer });

      const signer = createSigner(dmkTransport);
      const result = await signer.getAddress("44'/501'/0'/0'");

      expect(result).toEqual({ address: addressBuffer });
    });

    it("delegates signTransaction to the DMK signer", async () => {
      const signatureBuffer = Buffer.from("aabbcc", "hex");
      mockSignTransaction.mockResolvedValue({ signature: signatureBuffer });

      const signer = createSigner(dmkTransport);
      const txBase64 = Buffer.from("fake transaction bytes").toString("base64");
      const result = await signer.signTransaction("44'/501'/0'/0'", txBase64);

      expect(result).toBe("aabbcc");
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
