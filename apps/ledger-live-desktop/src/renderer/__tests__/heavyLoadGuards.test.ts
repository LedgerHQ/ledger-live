/**
 * Ensures the boot path does NOT load the families barrel or the bridge (all coin impls).
 * The only allowed entry point for heavy load is BridgeAndFamiliesLayer (lazy chunk).
 *
 * Run in isolation to verify: pnpm desktop test:jest heavyLoadGuards
 * In full suite this may run after another test that already loaded families/bridge in the
 * same worker, so the guards can be set; run the command above for a reliable check.
 */
import { registerTransportModules } from "~/renderer/live-common-setup";

declare global {
  // eslint-disable-next-line no-var
  var __LEDGER_FAMILIES_BARREL_LOADED__: true | undefined;
  // eslint-disable-next-line no-var
  var __LEDGER_BRIDGE_IMPL_LOADED__: true | undefined;
}

describe("Heavy load guards (boot path)", () => {
  it("loading live-common-setup alone does not load families barrel", () => {
    expect(registerTransportModules).toBeDefined();
    expect(globalThis.__LEDGER_FAMILIES_BARREL_LOADED__).toBeUndefined();
  });

  it("loading live-common-setup alone does not load bridge impl (generated/bridge/js → all coins)", () => {
    expect(registerTransportModules).toBeDefined();
    expect(globalThis.__LEDGER_BRIDGE_IMPL_LOADED__).toBeUndefined();
  });
});
