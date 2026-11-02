import type { PersistedCAL } from "@domain/api-currency-token";
import storage from "LLM/storage";
import { saveCryptoAssetsCacheState } from "./db";

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
