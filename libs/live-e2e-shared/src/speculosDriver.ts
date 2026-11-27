import { getEnv, setEnv } from "@shared/env";
import { Account } from "./enum/Account";
import { specs, startSpeculos, type SpeculosDevice } from "./speculos";
import { waitForSpeculosReady } from "./speculosCI";

export type DriverAccount = { path: string; specKey: string };

/** Resolves an `Account` key, e.g. "ETH_4", for a headless driver. */
export function resolveDriverAccount(name: string): DriverAccount {
  const account: unknown = Reflect.get(Account, name);
  if (!(account instanceof Account) || !account.accountPath) {
    throw new Error(`Unknown account "${name}" (expected an Account key, e.g. ETH_4)`);
  }
  return {
    path: account.accountPath,
    specKey: account.currency.speculosApp.name.replaceAll(" ", "_"),
  };
}

export type StartDriverSpeculosOptions = {
  /** Speculos test name and lock owner, e.g. "borrow-open". */
  name: string;
  suite: string;
  specKey: string;
  nanoAppCatalogPath?: string;
};

/** Starts a Speculos outside Playwright; the shared helpers read live-env. */
export async function startDriverSpeculos({
  name,
  suite,
  specKey,
  nanoAppCatalogPath,
}: StartDriverSpeculosOptions): Promise<SpeculosDevice> {
  if (!process.env.SEED) throw new Error("Missing SEED env (Speculos seed)");
  setEnv("MOCK", "");
  process.env.MOCK = "";
  setEnv("PLAYWRIGHT_RUN", true);
  if (nanoAppCatalogPath) {
    setEnv("E2E_NANO_APP_VERSION_PATH", nanoAppCatalogPath);
  } else if (!getEnv("E2E_NANO_APP_VERSION_PATH")) {
    throw new Error(
      "Missing Speculos app-version catalog: pass nanoAppCatalogPath or set E2E_NANO_APP_VERSION_PATH",
    );
  }
  const spec = specs[specKey];
  if (!spec) throw new Error(`No Speculos spec for "${specKey}"`);
  const device = await startSpeculos(name, spec, { suite });
  if (!device) throw new Error("Speculos not started");
  // The readiness poll publishes SPECULOS_ADDRESS for a remote device.
  if (process.env.REMOTE_SPECULOS === "true") await waitForSpeculosReady(device.id);
  return device;
}

/** Points the shared device helpers at `apiPort`. */
export function setSpeculosApiPort(apiPort: number): void {
  setEnv("SPECULOS_API_PORT", apiPort);
  process.env.SPECULOS_API_PORT = String(apiPort);
}
