import Transport from "@ledgerhq/hw-transport";
import { DefaultKeyringEth } from "./DefaultKeyringEth";
import { Transaction } from "ethers";

describe("DefaultEthKeyring", () => {
  describe("signTransaction function", () => {
    it("Test1", async () => {
      const keyring = new DefaultKeyringEth({
        send: jest.fn(),
        decorateAppAPIMethods: jest.fn(),
      } as unknown as Transport);

      const result = await keyring.signTransaction("", {} as Transaction, {});

      expect(result).toEqual({});
    });
  });
});
