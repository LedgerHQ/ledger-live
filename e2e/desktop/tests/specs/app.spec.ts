import { access } from "fs/promises";
import * as path from "path";
import { expect } from "@playwright/test";
import test from "../fixtures/common";

// These tests the general Ledger Waller app behavior

test.use({
  extraUserdataFiles: {
    "app.json.123": "stale",
  },
});

test(
  "cleanup removes stale app.json.* files on boot",
  {
    tag: ["@NanoSP", "@NanoX", "@LNS"],
  },
  async ({ page, userdataDestinationPath }) => {
    await page.title();

    const staleFilePath = path.join(userdataDestinationPath, "app.json.123");
    await expect(access(staleFilePath)).rejects.toThrow();
  },
);
