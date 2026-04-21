import { createSigner } from "../../loaders/xrp";
import Xrp from "@ledgerhq/hw-app-xrp";
import Transport from "@ledgerhq/hw-transport";

jest.mock("@ledgerhq/hw-app-xrp");
jest.mock("../../../../families/xrp/getAddress", () => jest.fn());

const MockedXrp = Xrp as jest.MockedClass<typeof Xrp>;
const mockTransport = {} as Transport;

describe("createSigner (XRP)", () => {
  let mockGetAddress: jest.Mock;

  beforeEach(() => {
    mockGetAddress = jest.fn().mockResolvedValue({
      publicKey: "deadbeef",
      address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    });
    MockedXrp.mockImplementation(
      () =>
        ({
          getAddress: mockGetAddress,
          signTransaction: jest.fn(),
        }) as unknown as Xrp,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAddress — display flag forwarded to hw-app-xrp", () => {
    it("should NOT display address on device when called with a derivationMode options object (send flow)", async () => {
      const signer = createSigner(mockTransport);

      await signer.getAddress("44'/144'/0'/0/0", { derivationMode: "xrp" });

      expect(mockGetAddress).toHaveBeenCalledWith("44'/144'/0'/0/0", false);
    });

    it("should NOT display address on device when called without options", async () => {
      const signer = createSigner(mockTransport);

      await signer.getAddress("44'/144'/0'/0/0");

      expect(mockGetAddress).toHaveBeenCalledWith("44'/144'/0'/0/0", false);
    });

    it("should NOT display address on device when called with verify: false", async () => {
      const signer = createSigner(mockTransport);

      await signer.getAddress("44'/144'/0'/0/0", { verify: false });

      expect(mockGetAddress).toHaveBeenCalledWith("44'/144'/0'/0/0", false);
    });

    it("should display address on device when called with boolean true (receive flow)", async () => {
      const signer = createSigner(mockTransport);

      await signer.getAddress("44'/144'/0'/0/0", true);

      expect(mockGetAddress).toHaveBeenCalledWith("44'/144'/0'/0/0", true);
    });

    it("should display address on device when called with verify: true", async () => {
      const signer = createSigner(mockTransport);

      await signer.getAddress("44'/144'/0'/0/0", { verify: true });

      expect(mockGetAddress).toHaveBeenCalledWith("44'/144'/0'/0/0", true);
    });

    it("should forward chainCode arg to the underlying signer (receive flow)", async () => {
      const signer = createSigner(mockTransport);

      await signer.getAddress("44'/144'/0'/0/0", true, false);

      expect(mockGetAddress).toHaveBeenCalledWith("44'/144'/0'/0/0", true, false);
    });
  });
});
