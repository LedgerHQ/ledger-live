import * as cacheModule from "@ledgerhq/live-network/cache";
import { makeBridgeCacheSystem } from "./cache";
import { getCryptoCurrencyById } from "../currencies";
import { setEnv } from "@ledgerhq/live-env";

describe("Bridge Cache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    setEnv("MOCK", "1");
  });

  afterAll(() => {
    setEnv("MOCK", "");
  });

  it("does not re-generate the LRU cache by default", async () => {
    const makeLRUCache = jest.spyOn(cacheModule, "makeLRUCache");
    const { prepareCurrency } = makeBridgeCacheSystem({
      saveData: () => Promise.resolve(),
      getData: () => Promise.resolve(null),
    });

    await prepareCurrency(getCryptoCurrencyById("solana"));
    expect(makeLRUCache).toHaveBeenCalledTimes(1);

    await prepareCurrency(getCryptoCurrencyById("solana"));
    expect(makeLRUCache).toHaveBeenCalledTimes(1);
  });

  it("forces the LRU cache to be re-generated", async () => {
    const makeLRUCache = jest.spyOn(cacheModule, "makeLRUCache");
    const { prepareCurrency } = makeBridgeCacheSystem({
      saveData: () => Promise.resolve(),
      getData: () => Promise.resolve(null),
    });

    await prepareCurrency(getCryptoCurrencyById("solana"));
    expect(makeLRUCache).toHaveBeenCalledTimes(1);

    await prepareCurrency(getCryptoCurrencyById("solana"), { forceUpdate: true });
    expect(makeLRUCache).toHaveBeenCalledTimes(2);
  });
});
