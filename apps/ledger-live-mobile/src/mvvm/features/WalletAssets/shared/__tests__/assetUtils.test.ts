import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { Asset } from "~/types/asset";
import { padAssetsWithDefaults } from "../assetUtils";

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

const makeAsset = (currency: ReturnType<typeof getCryptoCurrencyById>, amount = 0): Asset => ({
  currency,
  accounts: [],
  amount,
});

describe("padAssetsWithDefaults", () => {
  const asset1 = makeAsset(bitcoin);
  const asset2 = makeAsset(ethereum);
  const default1 = { ...makeAsset(bitcoin), isPlaceholder: true } as Asset;
  const default2 = { ...makeAsset(ethereum), isPlaceholder: true } as Asset;
  const default3 = {
    ...makeAsset(bitcoin),
    isPlaceholder: true,
    currency: { ...bitcoin, id: "litecoin" },
  } as Asset;

  it("should return owned assets unchanged when already at max", () => {
    const owned = [asset1, asset2];
    expect(padAssetsWithDefaults(owned, [default3], 2)).toEqual(owned);
  });

  it("should pad up to max with defaults when fewer than max are owned", () => {
    const result = padAssetsWithDefaults([asset1], [default2, default3], 3);

    expect(result).toHaveLength(3);
    expect(result[0]).toBe(asset1);
  });

  it("should not pad with assets already owned (deduplication by currency id)", () => {
    const result = padAssetsWithDefaults([asset1], [default1, default3], 2);

    expect(result).toHaveLength(2);
    expect(result[1].currency.id).toBe(default3.currency.id);
  });

  it("should return an empty array when both owned and defaults are empty", () => {
    expect(padAssetsWithDefaults([], [], 4)).toEqual([]);
  });

  it("should not exceed max even if more defaults are available", () => {
    const result = padAssetsWithDefaults([], [asset1, asset2, default3], 2);

    expect(result).toHaveLength(2);
  });
});
