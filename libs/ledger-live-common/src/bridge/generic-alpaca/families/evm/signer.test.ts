import { createSigner } from "../../loaders/evm";
import { LegacySignerEth, DmkSignerEth } from "@ledgerhq/live-signer-evm";
import Transport from "@ledgerhq/hw-transport";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";

jest.mock("@ledgerhq/live-signer-evm");
jest.mock("@ledgerhq/coin-evm/hw-getAddress", () => jest.fn());

const MockedLegacySignerEth = LegacySignerEth as jest.MockedClass<typeof LegacySignerEth>;
const mockTransport = {} as Transport;

describe("createSigner (EVM)", () => {
  let mockGetAddress: jest.Mock;

  beforeEach(() => {
    mockGetAddress = jest.fn().mockResolvedValue({
      publicKey: "deadbeef",
      address: "0x1234567890abcdef",
    });
    MockedLegacySignerEth.mockImplementation(
      () =>
        ({
          getAddress: mockGetAddress,
          setLoadConfig: jest.fn(),
          clearSignTransaction: jest.fn(),
        }) as unknown as LegacySignerEth,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAddress — display flag forwarded to LegacySignerEth", () => {
    it("should NOT display address on device when called with a derivationMode options object (send flow)", async () => {
      const signer = createSigner(mockTransport);

      await signer.getAddress("44'/60'/0'/0/0", { derivationMode: "ethM" });

      expect(mockGetAddress).toHaveBeenCalledWith("44'/60'/0'/0/0", false);
    });

    it("should NOT display address on device when called without options", async () => {
      const signer = createSigner(mockTransport);

      await signer.getAddress("44'/60'/0'/0/0");

      expect(mockGetAddress).toHaveBeenCalledWith("44'/60'/0'/0/0", false);
    });

    it("should NOT display address on device when called with verify: false", async () => {
      const signer = createSigner(mockTransport);

      await signer.getAddress("44'/60'/0'/0/0", { verify: false });

      expect(mockGetAddress).toHaveBeenCalledWith("44'/60'/0'/0/0", false);
    });

    it("should display address on device when called with boolean true (receive flow)", async () => {
      const signer = createSigner(mockTransport);

      await signer.getAddress("44'/60'/0'/0/0", true);

      expect(mockGetAddress).toHaveBeenCalledWith("44'/60'/0'/0/0", true);
    });

    it("should display address on device when called with verify: true", async () => {
      const signer = createSigner(mockTransport);

      await signer.getAddress("44'/60'/0'/0/0", { verify: true });

      expect(mockGetAddress).toHaveBeenCalledWith("44'/60'/0'/0/0", true);
    });

    it("should forward boolChaincode and chainId to the underlying signer (receive flow)", async () => {
      const signer = createSigner(mockTransport);

      await signer.getAddress("44'/60'/0'/0/0", true, false, "1");

      expect(mockGetAddress).toHaveBeenCalledWith("44'/60'/0'/0/0", true, false, "1");
    });
  });

  describe("DMK transport", () => {
    const MockedDmkSignerEth = DmkSignerEth as jest.MockedClass<typeof DmkSignerEth>;
    const mockDmk = {} as DeviceManagementKit;
    const dmkTransport = {
      dmk: mockDmk,
      sessionId: "test-session",
    } as unknown as Transport & { dmk: DeviceManagementKit; sessionId: string };

    beforeEach(() => {
      MockedDmkSignerEth.mockImplementation(
        () =>
          ({
            getAddress: mockGetAddress,
            setLoadConfig: jest.fn(),
            clearSignTransaction: jest.fn(),
          }) as unknown as DmkSignerEth,
      );
    });

    it("should NOT display address on device when called with a derivationMode options object (send flow)", async () => {
      const signer = createSigner(dmkTransport);

      await signer.getAddress("44'/60'/0'/0/0", { derivationMode: "ethM" });

      expect(mockGetAddress).toHaveBeenCalledWith("44'/60'/0'/0/0", false);
    });

    it("should NOT display address on device when called without options", async () => {
      const signer = createSigner(dmkTransport);

      await signer.getAddress("44'/60'/0'/0/0");

      expect(mockGetAddress).toHaveBeenCalledWith("44'/60'/0'/0/0", false);
    });

    it("should NOT display address on device when called with verify: false", async () => {
      const signer = createSigner(dmkTransport);

      await signer.getAddress("44'/60'/0'/0/0", { verify: false });

      expect(mockGetAddress).toHaveBeenCalledWith("44'/60'/0'/0/0", false);
    });

    it("should display address on device when called with boolean true (receive flow)", async () => {
      const signer = createSigner(dmkTransport);

      await signer.getAddress("44'/60'/0'/0/0", true);

      expect(mockGetAddress).toHaveBeenCalledWith("44'/60'/0'/0/0", true);
    });

    it("should display address on device when called with verify: true", async () => {
      const signer = createSigner(dmkTransport);

      await signer.getAddress("44'/60'/0'/0/0", { verify: true });

      expect(mockGetAddress).toHaveBeenCalledWith("44'/60'/0'/0/0", true);
    });

    it("should forward boolChaincode and chainId to the underlying signer (receive flow)", async () => {
      const signer = createSigner(dmkTransport);

      await signer.getAddress("44'/60'/0'/0/0", true, false, "1");

      expect(mockGetAddress).toHaveBeenCalledWith("44'/60'/0'/0/0", true, false, "1");
    });
  });
});
