import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import { getNetworkCoinModuleApi } from "./network-coin-service";

// These capabilities used to be hand-stubbed in network-coin-service. They are now omitted and
// supplied by the framework's `withDefaults` — the wrapper the resolver applies — so what must be
// held is parity: the caller still gets the exact same error from the exact same method names.
const OMITTED = [
  "craftRawTransaction",
  "getBlock",
  "getBlockInfo",
  "getStakes",
  "getRewards",
  "getValidators",
  "validateAddress",
  "call",
  "register",
] as const;

describe("getNetworkCoinModuleApi", () => {
  const api = withDefaults(getNetworkCoinModuleApi("xrp"));

  it.each(OMITTED)("still raises the 'not supported' error for %s", name => {
    expect(() => (api as any)[name]({})).toThrow(`${name} is not supported`);
  });

  it("reports the omitted capabilities as unsupported", () => {
    for (const name of OMITTED) {
      expect(api.supports(name)).toBe(false);
    }
  });

  // The gain over the hand-written stubs: a placeholder that throws is indistinguishable from an
  // implementation, so while they lived here `supports()` had to call every one of them supported.
  it("still reports the capabilities the backend does serve", () => {
    expect(api.supports("getNextSequence")).toBe(true);
    expect(api.supports("validateIntent")).toBe(true);
  });
});
