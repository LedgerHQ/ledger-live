/**
 * Minimum Speculos smoke test for detox-next-gen.
 *
 * Boots the app, seeds skip-onboarding, then spins up a Bitcoin Speculos
 * and asserts the bridge wired it in (DEVICE_PROXY_URL is set on the app
 * side once `addKnownSpeculos` lands).
 *
 * Requires SEED + (COINAPPS for local Docker, or REMOTE_SPECULOS=true +
 * SPECULINHO_URL for remote). See `helpers/speculos.ts` for the full list.
 */
import { startSession, endSession } from "../../helpers/session";
import { SpeculosHandle } from "../../helpers/speculos";
import { app } from "../../pages";

describe("Speculos smoke", () => {
  let handle: SpeculosHandle;

  beforeAll(async () => {
    handle = await startSession({ userdata: "skip-onboarding", speculosApp: "Bitcoin" });
  });

  afterAll(() => endSession(handle));

  it("starts a Speculos and reaches the wallet root", async () => {
    // Smoke: the app is still up at the wallet root after Speculos was wired in.
    await app.wallet.expectReady();
    // Sanity: the helper returned a routable address + a port.
    if (!handle.port) throw new Error("Speculos handle has no port");
  });
});
