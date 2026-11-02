import { cryptoAssetsApi } from "@domain/api-currency-token";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { calApi } from "@shared/api-services";
import { renderHook, waitFor } from "@tests/test-renderer";
import storage from "LLM/storage";
import { ConfigureDBSaveEffects } from "../DBSave";

describe("ConfigureDBSaveEffects", () => {
  beforeEach(async () => {
    await storage.delete("cryptoAssetsCache");
  });

  it("saves a CAL cache that the hash check updated before the effects mounted", async () => {
    const checkedCache = cryptoAssetsApi.util.upsertQueryEntries([
      { endpointName: "findTokenById", arg: { id: usdcToken.id }, value: usdcToken },
      { endpointName: "getTokensSyncHash", arg: "ethereum", value: "new-hash" },
    ]);

    renderHook(() => ConfigureDBSaveEffects(), {
      overrideInitialState: state => ({
        ...state,
        [calApi.reducerPath]: calApi.reducer(state[calApi.reducerPath], checkedCache),
      }),
    });

    await waitFor(async () =>
      expect(await storage.get("cryptoAssetsCache")).toMatchObject({
        tokens: [{ data: usdcToken }],
        hashes: { ethereum: "new-hash" },
      }),
    );
  });
});
