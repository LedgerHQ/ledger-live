import eip55 from "eip55";
import type { EvmAddress, EvmSignature, EvmSigner } from "../../types/signer";
import resolver from "../../hw-getAddress";

const address = "0xc3f95102D5c8F2c83e49Ce3Acfb905eDfb7f37dE";
jest.mock(
  "@ledgerhq/hw-app-eth",
  () =>
    class {
      getAddress = async (): Promise<{
        publicKey: string;
        address: string;
      }> => ({
        publicKey: "",
        address: address.toLowerCase(),
      });
    },
);
const mockSignerFactory = (
  _: string,
  fn: (signer: EvmSigner) => Promise<EvmAddress | EvmSignature>,
): Promise<EvmAddress | EvmSignature> =>
  fn({
    setLoadConfig: jest.fn(),
    getAddress: async () => ({
      publicKey: "",
      address: address.toLowerCase(),
    }),
    signTransaction: jest.fn(),
    signEIP712HashedMessage: jest.fn(),
    signEIP712Message: jest.fn(),
    signPersonalMessage: jest.fn(),
  });

describe("EVM Family", () => {
  describe("hw-getAddress.ts", () => {
    it("should return an eip 55 encoded address", async () => {
      const getAddress = resolver(mockSignerFactory);
      const response = await getAddress({} as any, {} as any);
      expect(response.address).toBe(address);
      expect(eip55.verify(response.address)).toBe(true);
    });
  });
});
