import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import { createApi } from "./index";
import { FUNDED_MAINNET_PUBLIC_KEY } from "../__tests__/fixtures/addresses.fixture";
import { casperMainnetConfig } from "../__tests__/fixtures/config.fixture";
import { CASPER_DUMMY_ADDRESS } from "../constants";

describe("Casper Api (mainnet)", () => {
  let api: CoinModuleApi;

  beforeAll(() => {
    api = createApi(casperMainnetConfig);
  });

  describe("lastBlock", () => {
    it("returns the latest block with valid height, hash and time", async () => {
      const block = await api.lastBlock();

      expect(block.height).toBeGreaterThan(0);
      expect(typeof block.hash).toBe("string");
      expect((block.hash as string).length).toBeGreaterThan(0);

      const oneDayMs = 24 * 60 * 60 * 1000;
      expect(block.time).toBeInstanceOf(Date);
      expect(block.time?.getTime()).toBeGreaterThan(Date.now() - oneDayMs);
      expect(block.time?.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("getBalance", () => {
    it("returns the native CSPR balance of a funded account", async () => {
      const balances = await api.getBalance(FUNDED_MAINNET_PUBLIC_KEY);

      expect(balances).toEqual([expect.objectContaining({ asset: { type: "native" } })]);
      expect(balances[0].value).toBeGreaterThan(0n);
    });

    it("returns a zero native balance for an account that was never funded", async () => {
      const balances = await api.getBalance(CASPER_DUMMY_ADDRESS);

      expect(balances).toEqual([{ value: 0n, asset: { type: "native" } }]);
    });
  });
});
