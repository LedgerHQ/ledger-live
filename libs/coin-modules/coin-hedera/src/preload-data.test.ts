import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import {
  getCurrentHederaPreloadData,
  getHederaPreloadData,
  setHederaPreloadData,
} from "./preload-data";
import type { HederaPreloadData } from "./types";
import { getMockedCurrency } from "./test/fixtures/currency.fixture";

describe("preload-data", () => {
  const hedera = getCryptoCurrencyById("hedera");
  const hederaTestnet = getCryptoCurrencyById("hedera_testnet");
  const testData = { validators: [{ nodeId: 1 }] } as HederaPreloadData;

  beforeEach(() => {
    setHederaPreloadData({ validators: [] }, hedera);
    setHederaPreloadData({ validators: [] }, hederaTestnet);
  });

  describe("getCurrentHederaPreloadData", () => {
    it("should return data set for the currency", () => {
      setHederaPreloadData(testData, hedera);

      expect(getCurrentHederaPreloadData(hedera)).toBe(testData);
    });

    it("should keep preload data isolated per currency", () => {
      setHederaPreloadData(testData, hedera);

      expect(getCurrentHederaPreloadData(hedera).validators).toHaveLength(1);
      expect(getCurrentHederaPreloadData(hederaTestnet).validators).toHaveLength(0);
    });

    it("should throw for unsupported currency", () => {
      const unsupportedCurrency = getMockedCurrency({ id: "bitcoin", family: "bitcoin" });

      expect(() => getCurrentHederaPreloadData(unsupportedCurrency)).toThrow(
        "unsupported currency bitcoin",
      );
    });
  });

  describe("getHederaPreloadData", () => {
    it("should emit updates when preload data changes", () => {
      const mockListener = jest.fn();
      const subscription = getHederaPreloadData(hedera).subscribe(mockListener);

      setHederaPreloadData(testData, hedera);

      expect(mockListener).toHaveBeenLastCalledWith(testData);
      subscription.unsubscribe();
    });

    it("should throw for unsupported currency", () => {
      const unsupportedCurrency = getMockedCurrency({ id: "bitcoin", family: "bitcoin" });

      expect(() => getHederaPreloadData(unsupportedCurrency)).toThrow(
        "unsupported currency bitcoin",
      );
    });
  });

  describe("setHederaPreloadData", () => {
    it("should throw for unsupported currency", () => {
      const unsupportedCurrency = getMockedCurrency({ id: "bitcoin", family: "bitcoin" });

      expect(() => setHederaPreloadData({ validators: [] }, unsupportedCurrency)).toThrow(
        "unsupported currency bitcoin",
      );
    });
  });
});
