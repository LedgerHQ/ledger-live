import Transport from "@ledgerhq/hw-transport";
import { LegacySignerPolkadot } from "../src/LegacySignerPolkadot";

const mockGetAddress = jest.fn();
const mockSign = jest.fn();

jest.mock("@ledgerhq/hw-app-polkadot", () => {
  return jest.fn().mockImplementation(() => ({
    getAddress: mockGetAddress,
    sign: mockSign,
  }));
});

describe("LegacySignerPolkadot", () => {
  let signer: LegacySignerPolkadot;

  beforeEach(() => {
    jest.clearAllMocks();
    signer = new LegacySignerPolkadot({} as Transport);
  });

  describe("getAddress", () => {
    it("should delegate to hw-app-polkadot with correct args", async () => {
      const expectedResult = {
        pubKey: "abcdef",
        address: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqWrztPu4T2ABCDEF",
        return_code: 0x9000,
      };
      mockGetAddress.mockResolvedValue(expectedResult);

      const result = await signer.getAddress("44'/354'/0'/0'/0'", 42, true);

      expect(mockGetAddress).toHaveBeenCalledWith("44'/354'/0'/0'/0'", 42, true);
      expect(result).toEqual(expectedResult);
    });

    it("should pass undefined for showAddrInDevice when not provided", async () => {
      const expectedResult = {
        pubKey: "abcdef",
        address: "addr",
        return_code: 0x9000,
      };
      mockGetAddress.mockResolvedValue(expectedResult);

      await signer.getAddress("44'/354'/0'/0'/0'", 0);

      expect(mockGetAddress).toHaveBeenCalledWith("44'/354'/0'/0'/0'", 0, undefined);
    });
  });

  describe("sign", () => {
    it("should delegate to hw-app-polkadot with correct args", async () => {
      const expectedResult = {
        signature: "0x0102030405",
        return_code: 0x9000,
      };
      mockSign.mockResolvedValue(expectedResult);

      const message = new Uint8Array([0x10, 0x20]);
      const metadata = "0xdeadbeef";

      const result = await signer.sign("44'/354'/0'/0'/0'", message, metadata);

      expect(mockSign).toHaveBeenCalledWith("44'/354'/0'/0'/0'", message, metadata);
      expect(result).toEqual(expectedResult);
    });
  });
});
