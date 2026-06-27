/**
 * Spec lifecycle in one place: boot the app (and optionally a Speculos) in
 * `beforeAll`, tear it all down in `afterAll`. Specs call these instead of
 * repeating the `launchApp` → `loadConfig` → `launchSpeculos` orchestration
 * (and its teardown) in every file.
 *
 *   beforeAll(async () => { handle = await startSession({ userdata, speculosApp }); });
 *   afterAll(() => endSession(handle));
 *
 * Speculos specs that need a bespoke device dance (e.g. the swap blind-signing
 * toggle, or the CEX two-app boot) still call `launchSpeculos`/`shutdownSpeculos`
 * directly — `startSession` only owns the common boot.
 */
import { specs } from "@ledgerhq/live-common/e2e/speculos";
import { launchApp, closeApp } from "./launchApp";
import { loadConfig } from "./loadConfig";
import { launchSpeculos, shutdownSpeculos, SpeculosHandle } from "./speculos";

export type SessionOptions = {
  /** Userdata fixture to seed Redux from, e.g. "skip-onboarding" or "device-ready". */
  userdata: string;
  /** Speculos app to boot and wire in, e.g. "Ethereum". Omit for UI-only specs. */
  speculosApp?: keyof typeof specs;
};

// With `speculosApp` set the handle is always returned, so callers get a
// non-optional `SpeculosHandle`; without it there's nothing to return.
export function startSession(
  options: SessionOptions & { speculosApp: keyof typeof specs },
): Promise<SpeculosHandle>;
export function startSession(options: SessionOptions): Promise<SpeculosHandle | undefined>;
export async function startSession(options: SessionOptions): Promise<SpeculosHandle | undefined> {
  await launchApp();
  await loadConfig(options.userdata);
  return options.speculosApp ? launchSpeculos(options.speculosApp) : undefined;
}

/** Shut down Speculos (if any) then close the app/bridge. Safe to call with no handle. */
export async function endSession(handle?: SpeculosHandle): Promise<void> {
  if (handle) await shutdownSpeculos(handle);
  closeApp();
}
