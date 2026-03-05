import { access, readFile } from "fs/promises";
import * as path from "path";
import { expect } from "@playwright/test";
import test from "../fixtures/common";

// These tests cover the general Ledger Wallet app behavior

test.describe("App.json cleanup", () => {
  test.use({
    extraUserdataFiles: {
      "app.json.123": "stale",
    },
  });

  test(
    "cleanup removes stale app.json.* files on boot",
    {
      tag: ["@smoke", "@NanoSP", "@NanoX", "@LNS"],
    },
    async ({ page, userdataDestinationPath }) => {
      await page.title();

      const staleFilePath = path.join(userdataDestinationPath, "app.json.123");
      await expect(access(staleFilePath)).rejects.toThrow();
    },
  );
});

test.describe("Identities migration from legacy user", () => {
  test.use({ userdata: "skip-onboarding" });

  test(
    "after boot with skip-onboarding userdata, user id is in store identities (same value), deviceIds [], new datadogId",
    { tag: ["@smoke", "@NanoSP", "@NanoX", "@LNS"] },
    async ({ app, page, userdataFile, userdataOriginalFile }) => {
      // Read legacy user id from the original fixture: the app overwrites app.json
      // and drops "user" when it saves identities, so userdataFile no longer has it.
      const initial = JSON.parse(await readFile(userdataOriginalFile!, "utf-8"));
      const legacyUserId = initial?.data?.user?.id;
      expect(legacyUserId).toBeDefined();
      expect(typeof legacyUserId).toBe("string");

      await page.title();

      const identities = await app.portfolio.expectIdentitiesPersistedInAppJson(
        userdataFile,
        15000,
      );

      expect(identities.userId).toBe(legacyUserId);
      expect(identities.deviceIds).toEqual([]);
      expect(identities.datadogId).toBeDefined();
      expect(identities.datadogId).not.toBe("");
    },
  );
});

test.describe("App namespace allow list", () => {
  test.use({ userdata: "app-allowlist-cleanup" });

  test(
    "invalid keys in app.json are dropped on load and not written back",
    { tag: ["@smoke", "@NanoSP", "@NanoX", "@LNS"] },
    async ({ app, userdataFile }) => {
      await app.layout.goToSettings();

      await app.portfolio.expectIdentitiesPersistedInAppJson(userdataFile, 15000);

      const content = await readFile(userdataFile, "utf-8");
      const parsed = JSON.parse(content);
      expect(parsed.data).toBeDefined();
      expect(parsed.data._this_is_not_valid_field_).toBeUndefined();
      expect(parsed.data.user).toBeUndefined();
      expect(parsed.data.identities).toBeDefined();
    },
  );
});
