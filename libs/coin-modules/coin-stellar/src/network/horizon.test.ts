import coinConfig from "../config";
import { useConfigHostAndProtocol } from "./horizon";

describe("Horizon", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(
      () => ({ explorer: { url: "https://stellar.coin.ledger.com" } }) as any,
    );
  });

  describe("useConfigHostAndProtocol", () => {
    it.each([
      ["host", "https://injected.com/1"],
      ["protocol", "injected://stellar.coin.ledger.com/1"],
    ])("overwrites the %s of the URL with the original one", (_s, url) => {
      expect(useConfigHostAndProtocol(url)).toEqual("https://stellar.coin.ledger.com/1");
    });
  });
});
