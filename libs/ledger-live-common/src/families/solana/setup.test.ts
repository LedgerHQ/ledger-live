import Solana from "@ledgerhq/hw-app-solana";
import Transport from "@ledgerhq/hw-transport";
import { Account, AnyMessage } from "@ledgerhq/types-live";
import { messageSigner } from "./setup";

const SIGNATURE =
  "4gVuB1KsM58fb3vRpnDucwW4Vi6fVGA51QDQd9ARvx4GH5yYVDPzDnvzUbSJf3YLWWdsX7zCMSN9N1GMnTYwWiJf";

const signOffchainMessageMock = jest.fn(() => ({
  signature: SIGNATURE,
}));

jest.mock("@ledgerhq/hw-app-solana", () => {
  return jest.fn().mockImplementation(() => {
    return { signOffchainMessage: signOffchainMessageMock };
  });
});

describe("Testing setup on Solana", () => {
  describe("Testing message signer", () => {
    it("should call hardware for off-chain message signature", async () => {
      const freshAddressPath = "44'/60'/0'/0/0";
      const message = "54 65 73 74 69 6E 67 20 6F 6E 20 53 6F 6C 61 6E 61";
      const result = await messageSigner.signMessage(
        {} as Transport,
        { freshAddressPath: freshAddressPath } as Account,
        { message: message } as AnyMessage,
      );

      expect(Solana).toHaveBeenCalledTimes(1);
      expect(signOffchainMessageMock).toHaveBeenCalledTimes(1);
      expect(signOffchainMessageMock).toHaveBeenCalledWith(
        freshAddressPath,
        Buffer.from(message, "hex"),
      );

      expect(result.signature).toEqual(SIGNATURE);
      expect(result.rsv).toBeUndefined();
    });
  });
});
