import type { PersistedCAL } from "@domain/api-currency-token";
import storage from "LLM/storage";
import { getCountervalues, saveCryptoAssetsCacheState } from "./db";

describe("saveCryptoAssetsCacheState", () => {
  beforeEach(async () => {
    await storage.delete("cryptoAssetsCache");
  });

  it("saves a CAL cache that holds hashes but no token, so an eviction replaces stale tokens", async () => {
    const persisted: PersistedCAL = { version: 2, tokens: [], hashes: { ethereum: "new-hash" } };

    await saveCryptoAssetsCacheState(persisted);

    expect(await storage.get("cryptoAssetsCache")).toEqual(persisted);
  });

  it("does not save a CAL cache with neither tokens nor hashes", async () => {
    await saveCryptoAssetsCacheState({ version: 2, tokens: [] });

    expect(await storage.get("cryptoAssetsCache")).toBeFalsy();
  });
});

describe("getCountervalues", () => {
  const btcUsd = { latest: 1, "2026-11-01": 2 };
  const ethUsd = { latest: 3, "2026-11-01": 4 };

  beforeEach(async () => {
    await storage.delete(await storage.keys());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps each value with its own pair when a value in the middle is missing", async () => {
    await storage.save([
      ["countervalues.BTC USD", btcUsd],
      ["countervalues.ETH USD", ethUsd],
    ]);
    jest
      .spyOn(storage, "keys")
      .mockResolvedValue([
        "countervalues.BTC USD",
        "countervalues.SOL USD",
        "countervalues.ETH USD",
      ]);

    expect(await getCountervalues()).toEqual({
      "BTC USD": btcUsd,
      "ETH USD": ethUsd,
    });
  });

  it("returns an empty status when no countervalues are saved", async () => {
    expect(await getCountervalues()).toEqual({ status: {} });
  });
});
