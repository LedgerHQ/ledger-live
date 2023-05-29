import getAddress from "../hw-getAddress";
import eip55 from "eip55";

const address = "0xc3f95102D5c8F2c83e49Ce3Acfb905eDfb7f37dE";
jest.mock(
  "@ledgerhq/hw-app-eth",
  () =>
    class {
      getAddress = async () => ({
        publicKey: "",
        address: address.toLowerCase(),
      });
    }
);

describe("EVM Family", () => {
  describe("hw-getAddress.ts", () => {
    it("should return an eip 55 encoded address", async () => {
      const response = await getAddress({} as any, {} as any);
      expect(response.address).toBe(address);
      expect(eip55.verify(response.address)).toBe(true);
    });
  });
});
