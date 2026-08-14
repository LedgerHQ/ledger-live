import type { InstalledItem } from "@ledgerhq/live-common/apps/types";
import {
  resolveAppsRestoreTrigger,
  resolveFirmwareUpdateCloseAction,
  resolveInstalledAppsForFirmwareUpdate,
  resolveListedAppsListingEffect,
} from "./firmwareUpdateAppsRestore";

const bitcoinApp: InstalledItem = {
  name: "Bitcoin",
  version: "1.0.0",
  hash: "",
  updated: false,
  blocks: 0,
  availableVersion: "1.0.0",
};

describe("resolveInstalledAppsForFirmwareUpdate", () => {
  it("returns cached apps when already listed", () => {
    expect(resolveInstalledAppsForFirmwareUpdate([bitcoinApp], undefined)).toEqual({
      type: "ready",
      installed: [bitcoinApp],
    });
  });

  it("returns listed apps when cache is empty", () => {
    expect(resolveInstalledAppsForFirmwareUpdate([], [bitcoinApp])).toEqual({
      type: "ready",
      installed: [bitcoinApp],
    });
  });

  it("returns needsListing when neither cache nor list result is available", () => {
    expect(resolveInstalledAppsForFirmwareUpdate([], undefined)).toEqual({
      type: "needsListing",
    });
  });
});

describe("resolveListedAppsListingEffect", () => {
  it("does nothing when listing is not active", () => {
    expect(resolveListedAppsListingEffect(false, null, [], [bitcoinApp])).toEqual({ type: "noop" });
  });

  it("opens the drawer with cached apps when listing fails", () => {
    expect(
      resolveListedAppsListingEffect(true, new Error("list failed"), [bitcoinApp], undefined),
    ).toEqual({ type: "openWithCached", installed: [bitcoinApp] });
  });

  it("waits while listing is still in progress", () => {
    expect(resolveListedAppsListingEffect(true, null, [], undefined)).toEqual({
      type: "noop",
    });
  });

  it("opens the drawer with listed apps when listing succeeds", () => {
    expect(resolveListedAppsListingEffect(true, null, [], [bitcoinApp])).toEqual({
      type: "openWithListed",
      installed: [bitcoinApp],
    });
  });
});

describe("resolveFirmwareUpdateCloseAction", () => {
  it("restores apps after a completed update that uninstalls them", () => {
    expect(resolveFirmwareUpdateCloseAction(true, true, [bitcoinApp])).toEqual({
      type: "restoreApps",
      apps: ["Bitcoin"],
    });
  });

  it("restarts checks when the update did not complete", () => {
    expect(resolveFirmwareUpdateCloseAction(false, true, [bitcoinApp])).toEqual({
      type: "restartChecks",
    });
  });

  it("restarts checks when apps are kept on device", () => {
    expect(resolveFirmwareUpdateCloseAction(true, false, [bitcoinApp])).toEqual({
      type: "restartChecks",
    });
  });

  it("restarts checks when no apps were installed", () => {
    expect(resolveFirmwareUpdateCloseAction(true, true, [])).toEqual({
      type: "restartChecks",
    });
  });
});

describe("resolveAppsRestoreTrigger", () => {
  it("starts restore when apps are provided", () => {
    expect(resolveAppsRestoreTrigger(["Bitcoin", "Ethereum"])).toEqual({
      type: "startRestore",
      apps: ["Bitcoin", "Ethereum"],
    });
  });

  it("restarts checks when there are no apps to restore", () => {
    expect(resolveAppsRestoreTrigger([])).toEqual({ type: "restartChecks" });
  });
});
