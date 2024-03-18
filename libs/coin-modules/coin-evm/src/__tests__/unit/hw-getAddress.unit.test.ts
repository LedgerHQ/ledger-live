import eip55 from "eip55";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { EvmAddress, EvmSignature, EvmSigner } from "../../types/signer";
import resolver from "../../hw-getAddress";

const address = "0xc3f95102D5c8F2c83e49Ce3Acfb905eDfb7f37dE";
const spy = jest.fn().mockImplementation(async () =>
  Promise.resolve({
    publicKey: "",
    address: address.toLowerCase(),
  }),
);
const mockSignerFactory = (
  _: string,
  fn: (signer: EvmSigner) => Promise<EvmAddress | EvmSignature>,
): Promise<EvmAddress | EvmSignature> =>
  fn({
    getAddress: spy,
  } as any);

describe("EVM Family", () => {
  describe("hw-getAddress.ts", () => {
    it("should return an eip 55 encoded address", async () => {
      const getAddress = resolver(mockSignerFactory);
      const response = await getAddress(
        {} as any,
        { path: "44'/60'/0'/0/0", verify: true, currency: getCryptoCurrencyById("polygon") } as any,
      );
      expect(response.address).toBe(address);
      expect(eip55.verify(response.address)).toBe(true);
      expect(spy).toHaveBeenCalledWith("44'/60'/0'/0/0", true, false, "137");
    });
  });
});
