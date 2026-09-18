import storage from "LLM/storage";
import { hasKnownInstall, writeInstallMarker } from "./installMarker";

jest.mock("LLM/storage", () => ({
  __esModule: true,
  default: { get: jest.fn(), update: jest.fn() },
}));

const store = storage as unknown as { get: jest.Mock; update: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();
  store.get.mockResolvedValue(undefined);
  store.update.mockResolvedValue(undefined);
});

describe("knowing whether the protection belongs to this install", () => {
  it("does once the marker has been written", async () => {
    store.get.mockImplementation(async (key: string) =>
      key === "app-lock-install" ? "installed" : undefined,
    );

    await expect(hasKnownInstall()).resolves.toBe(true);
  });

  // The upgrade path, and the reason this is not a marker check alone: an existing user has
  // protection from before the marker existed, and reading that as a reinstall would delete it.
  it("does for an install that predates the marker, told by a finished onboarding", async () => {
    store.get.mockImplementation(async (key: string) =>
      key === "settings" ? { language: "en", hasCompletedOnboarding: true } : undefined,
    );

    await expect(hasKnownInstall()).resolves.toBe(true);
  });

  // The reinstall this whole check exists for: the app writes settings within a second of any
  // launch, so their presence proves nothing about the install they came from.
  it("does not for settings this launch has just written itself", async () => {
    store.get.mockImplementation(async (key: string) =>
      key === "settings" ? { language: "en", hasCompletedOnboarding: false } : undefined,
    );

    await expect(hasKnownInstall()).resolves.toBe(false);
  });

  it("does not for settings that say nothing about onboarding", async () => {
    store.get.mockImplementation(async (key: string) =>
      key === "settings" ? { language: "en" } : undefined,
    );

    await expect(hasKnownInstall()).resolves.toBe(false);
  });

  it("does not when app storage holds nothing, which is what an uninstall leaves", async () => {
    await expect(hasKnownInstall()).resolves.toBe(false);
  });

  it("writes a marker the next launch can read", async () => {
    await writeInstallMarker();

    expect(store.update).toHaveBeenCalledWith("app-lock-install", "installed");
  });
});
