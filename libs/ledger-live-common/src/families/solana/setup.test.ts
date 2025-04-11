import Solana from "@ledgerhq/hw-app-solana";
import Transport from "@ledgerhq/hw-transport";
import { Account, AnyMessage } from "@ledgerhq/types-live";
import { messageSigner } from "./setup";

const SIGNATURE =
  "97fb71bae8971e272b17a464dc2f76995de2da9fc5d40e369edc43b0c3f7c601c4e5a60bb7c6ac69671120c381ce5cab7a06f53eb802e3ac555066455f2cbd05";

const signOffchainMessageMock = jest.fn(() =>
  Promise.resolve({
    signature: SIGNATURE,
  }),
);

jest.mock("@ledgerhq/hw-app-solana", () => {
  return jest.fn().mockImplementation(() => {
    return { signOffchainMessage: signOffchainMessageMock };
  });
});

describe("Testing setup on Solana", () => {
  describe("Testing message signer", () => {
    it("should call hardware for off-chain message signature", async () => {
      const freshAddressPath = "44'/60'/0'/0/0";
      const message = "4c6f6e67204f66662d436861696e2054657374204d6573736167652e";
      const result = await messageSigner.signMessage(
        {} as Transport,
        { freshAddressPath: freshAddressPath } as Account,
        { message: message } as AnyMessage,
      );

      expect(Solana).toHaveBeenCalledTimes(1);
      expect(signOffchainMessageMock).toHaveBeenCalledTimes(1);

      const args = signOffchainMessageMock.mock.calls[0] as unknown[];
      expect(args[0]).toEqual(freshAddressPath);

      // Sign off-chain message must have an header: "\xff solana offchain"
      // We check here that the message passed as parameter start with this header
      expect((args[1] as Buffer).toString("hex")).toMatch(
        /^ff736f6c616e61206f6666636861696e000138003463366636653637323034663636363632643433363836313639366532303534363537333734323034643635373337333631363736353265$/,
      );

      expect(result.signature).toEqual(SIGNATURE);
      expect(result.rsv).toBeUndefined();
    });
  });
});
