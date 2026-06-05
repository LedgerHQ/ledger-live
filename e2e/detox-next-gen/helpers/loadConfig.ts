/**
 * Seed Redux state from a userdata JSON file.
 *
 * The shape mirrors what `apps/ledger-live-mobile/e2e/bridge/client.ts`
 * understands (importSettings / importAccounts / overrideFeatureFlag).
 * Add new top-level keys here as you need new seed primitives.
 */
import fs from "fs";
import path from "path";
import * as bridge from "../bridge/server";

type UserData = {
  data: {
    settings?: Record<string, unknown>;
    accounts?: unknown[];
    featureFlags?: { overrides?: Record<string, unknown> };
  };
};

const USERDATA_DIR = path.resolve(__dirname, "..", "userdata");

export async function loadConfig(name: string): Promise<void> {
  const file = path.join(USERDATA_DIR, `${name}.json`);
  const { data } = JSON.parse(fs.readFileSync(file, "utf8")) as UserData;

  // 1. Accept terms first — otherwise the legal-consent gate blocks dispatch.
  await bridge.send({ type: "acceptTerms" });

  // 2. Push settings (analytics opt-out is always forced to keep CI quiet).
  await bridge.send({
    type: "importSettings",
    payload: {
      shareAnalytics: false,
      hasSeenAnalyticsOptInPrompt: true,
      ...(data.settings ?? {}),
    },
  });

  // 3. Feature flag overrides BEFORE navigate — flags like lwmWallet40
  //    pick the active main navigator, so the Base route must mount the
  //    Wallet 4.0 stack rather than the legacy one.
  for (const [id, value] of Object.entries(data.featureFlags?.overrides ?? {})) {
    await bridge.send({ type: "overrideFeatureFlag", payload: { id, value } });
  }

  // 4. Navigate to the wallet/base navigator.
  await bridge.send({ type: "navigate", payload: "Base" });

  // 5. Accounts (optional).
  if (data.accounts?.length) {
    await bridge.send({ type: "importAccounts", payload: data.accounts });
  }
}
