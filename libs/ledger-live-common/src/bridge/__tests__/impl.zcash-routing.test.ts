import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "../../mock/account";
import { coinModuleLoaders } from "../../coin-modules/loaders";
import { registerCoinModules, resetCoinModulesForTests } from "../../coin-modules/registry";
import { getFeature } from "../../firebase/featureFlags";
import { clearBridgeCache, getAccountBridge, getCurrencyBridge, resolveFamily } from "../impl";

jest.mock("../../firebase/featureFlags");
const mockGetFeature = getFeature as jest.MockedFunction<typeof getFeature>;

const ZCASH = getCryptoCurrencyById("zcash");
const BITCOIN = getCryptoCurrencyById("bitcoin");

const loadersFor = (...families: string[]) =>
  coinModuleLoaders.filter(l => families.includes(l.family));

describe("bridge/impl -- zcash routing (zcashCoinModule flag)", () => {
  beforeEach(() => {
    resetCoinModulesForTests();
    registerCoinModules(loadersFor("bitcoin", "zcash"));
    clearBridgeCache();
    mockGetFeature.mockReset();
  });

  it("resolveFamily returns 'bitcoin' for zcash when the flag is absent/off", () => {
    mockGetFeature.mockReturnValue(null);
    expect(resolveFamily(ZCASH)).toBe("bitcoin");

    mockGetFeature.mockReturnValue({ enabled: false } as ReturnType<typeof getFeature>);
    expect(resolveFamily(ZCASH)).toBe("bitcoin");
  });

  it("resolveFamily returns 'zcash' for zcash when the flag is enabled", () => {
    mockGetFeature.mockReturnValue({ enabled: true } as ReturnType<typeof getFeature>);
    expect(resolveFamily(ZCASH)).toBe("zcash");
  });

  it("resolveFamily never touches any other currency's family", () => {
    mockGetFeature.mockReturnValue({ enabled: true } as ReturnType<typeof getFeature>);
    expect(resolveFamily(BITCOIN)).toBe("bitcoin");
    expect(mockGetFeature).not.toHaveBeenCalled();
  });

  it("getCurrencyBridge resolves the coin-zcash currencyBridge when the flag is ON", async () => {
    mockGetFeature.mockReturnValue({ enabled: true } as ReturnType<typeof getFeature>);
    const bridge = await getCurrencyBridge(ZCASH);
    expect(bridge).toBeDefined();
    expect(typeof bridge.scanAccounts).toBe("function");
  });

  it("getCurrencyBridge resolves the coin-bitcoin currencyBridge when the flag is OFF", async () => {
    mockGetFeature.mockReturnValue({ enabled: false } as ReturnType<typeof getFeature>);
    const bridge = await getCurrencyBridge(ZCASH);
    expect(bridge).toBeDefined();
    expect(typeof bridge.scanAccounts).toBe("function");
  });

  it("getAccountBridge routes a zcash account to the right family bridge in both flag states, with no cache leak", async () => {
    const account = genAccount("zcash-routing-test", { currency: ZCASH });

    mockGetFeature.mockReturnValue({ enabled: true } as ReturnType<typeof getFeature>);
    const onBridge = await getAccountBridge(account);
    expect(onBridge).toBeDefined();

    mockGetFeature.mockReturnValue({ enabled: false } as ReturnType<typeof getFeature>);
    const offBridge = await getAccountBridge(account);
    expect(offBridge).toBeDefined();

    // Distinct family caches (bitcoin vs zcash) -- flipping the flag back must
    // resolve the ON bridge again rather than staying stuck on the OFF one.
    mockGetFeature.mockReturnValue({ enabled: true } as ReturnType<typeof getFeature>);
    const onBridgeAgain = await getAccountBridge(account);
    expect(onBridgeAgain).toBe(onBridge);
    expect(onBridgeAgain).not.toBe(offBridge);
  });
});
