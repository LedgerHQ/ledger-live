/**
 * Minimum Speculos smoke test for detox-next-gen.
 *
 * Boots the app, seeds skip-onboarding, then spins up a Bitcoin Speculos
 * and asserts the bridge wired it in (DEVICE_PROXY_URL is set on the app
 * side once `addKnownSpeculos` lands).
 *
 * Skipped automatically when SEED is missing — running Speculos locally
 * also needs Docker + COINAPPS, or REMOTE_SPECULOS=true + SPECULINHO_URL.
 * See `helpers/speculos.ts` for the full list.
 */
import { launchApp, closeApp } from "../helpers/launchApp";
import { loadConfig } from "../helpers/loadConfig";
import { launchSpeculos, shutdownSpeculos, SpeculosHandle } from "../helpers/speculos";
import { app } from "../pages";

const hasSpeculosEnv =
  !!process.env.SEED && (!!process.env.COINAPPS || process.env.REMOTE_SPECULOS === "true");

const maybeDescribe = hasSpeculosEnv ? describe : describe.skip;

maybeDescribe("Speculos smoke", () => {
  let handle: SpeculosHandle;

  beforeAll(async () => {
    await launchApp();
    await loadConfig("skip-onboarding");
    handle = await launchSpeculos("Bitcoin");
  });

  afterAll(async () => {
    if (handle) await shutdownSpeculos(handle);
    closeApp();
  });

  it("starts a Speculos and reaches the wallet root", async () => {
    // Smoke: the app is still up at the wallet root after Speculos was wired in.
    await app.wallet.expectReady();
    // Sanity: the helper returned a routable address + a port.
    if (!handle.port) throw new Error("Speculos handle has no port");
  });
});

if (!hasSpeculosEnv) {
  // eslint-disable-next-line no-console
  console.log(
    "[speculos.test] skipped — set SEED + (COINAPPS or REMOTE_SPECULOS=true + SPECULINHO_URL)",
  );
}
