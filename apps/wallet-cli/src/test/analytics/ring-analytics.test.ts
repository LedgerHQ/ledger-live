import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import * as segment from "../../analytics/segment";
import {
  trackRingInitStarted,
  trackRingInitCompleted,
  trackRingEncrypt,
  trackRingDecrypt,
  trackRingKeysViewed,
  trackRingDestroyStarted,
  trackRingDestroyCompleted,
  trackRingDestroyCancelled,
} from "../../analytics/ring-analytics";

// Spy on the real `track` export rather than mock.module("../../analytics/segment"): mock.module is
// global and persists across test files, so mocking the segment module here would replace the real
// `track` used by segment.test.ts. A spyOn is restored in afterEach and stays local to this file.
type TrackCall = [event: string, properties?: Record<string, unknown> | null];

let trackSpy: ReturnType<typeof spyOn<typeof segment, "track">>;
const calls = (): TrackCall[] => trackSpy.mock.calls as TrackCall[];

// Values that must never leak into any ring analytics payload.
const PII_MARKERS = [
  "my-secret-key",
  "prod-domain",
  "/Users/alice/secret.txt",
  "alice-macbook (darwin)",
  "mock-root-id",
  "m/0'/16'/0'",
  "m/0'/17'/0'", // the configured LKRP app id (17); keep 16 too so either would be caught if leaked
];

function assertNoPii(properties: Record<string, unknown> | null | undefined): void {
  const serialized = JSON.stringify(properties ?? {});
  for (const marker of PII_MARKERS) {
    expect(serialized).not.toContain(marker);
  }
}

describe("ring analytics", () => {
  beforeEach(() => {
    trackSpy = spyOn(segment, "track").mockImplementation(() => {});
  });

  afterEach(() => {
    trackSpy.mockRestore();
  });

  it("ringinit_started carries only non-PII booleans", () => {
    trackRingInitStarted({ passwordProtected: true, usedCustomName: false });
    expect(calls()).toHaveLength(1);
    expect(calls()[0][0]).toBe("ringinit_started");
    expect(calls()[0][1]).toEqual({
      page: "Ring - Init",
      passwordProtected: true,
      usedCustomName: false,
    });
  });

  it("ringinit_completed carries only the passwordProtected flag", () => {
    trackRingInitCompleted({ passwordProtected: false });
    expect(calls()[0][0]).toBe("ringinit_completed");
    expect(calls()[0][1]).toEqual({
      page: "Ring - Init",
      passwordProtected: false,
    });
  });

  it("ring_encrypted carries only io enums and the newKey flag", () => {
    trackRingEncrypt({ inputSource: "file", outputDest: "stdout", newKey: true });
    expect(calls()[0][0]).toBe("ring_encrypted");
    expect(calls()[0][1]).toEqual({
      page: "Ring - Encrypt",
      inputSource: "file",
      outputDest: "stdout",
      newKey: true,
    });
  });

  it("ring_decrypted carries only io enums", () => {
    trackRingDecrypt({ inputSource: "stdin", outputDest: "file" });
    expect(calls()[0][0]).toBe("ring_decrypted");
    expect(calls()[0][1]).toEqual({
      page: "Ring - Decrypt",
      inputSource: "stdin",
      outputDest: "file",
    });
  });

  it("ringkeys_viewed carries only the key count, never key names", () => {
    trackRingKeysViewed({ keysCount: 3 });
    expect(calls()[0][0]).toBe("ringkeys_viewed");
    expect(calls()[0][1]).toEqual({
      page: "Ring - Keys",
      keysCount: 3,
    });
  });

  it("ringdestroy_started carries only the passwordProtected flag", () => {
    trackRingDestroyStarted({ passwordProtected: true });
    expect(calls()[0][0]).toBe("ringdestroy_started");
    expect(calls()[0][1]).toEqual({
      page: "Ring - Destroy",
      passwordProtected: true,
    });
  });

  it("ringdestroy_completed carries only outcome booleans", () => {
    trackRingDestroyCompleted({
      remoteSucceeded: true,
      trustchainDestroyed: true,
      localWiped: true,
      recoveryWipe: false,
    });
    expect(calls()[0][0]).toBe("ringdestroy_completed");
    expect(calls()[0][1]).toEqual({
      page: "Ring - Destroy",
      remoteSucceeded: true,
      trustchainDestroyed: true,
      localWiped: true,
      recoveryWipe: false,
    });
  });

  it("ringdestroy_cancelled carries only the page", () => {
    trackRingDestroyCancelled();
    expect(calls()[0][0]).toBe("ringdestroy_cancelled");
    expect(calls()[0][1]).toEqual({ page: "Ring - Destroy" });
  });

  it("never forwards key names, file paths, member names, or trustchain ids", () => {
    trackRingInitStarted({ passwordProtected: true, usedCustomName: true });
    trackRingInitCompleted({ passwordProtected: true });
    trackRingEncrypt({ inputSource: "file", outputDest: "file", newKey: true });
    trackRingDecrypt({ inputSource: "file", outputDest: "file" });
    trackRingKeysViewed({ keysCount: 5 });
    trackRingDestroyStarted({ passwordProtected: true });
    trackRingDestroyCompleted({
      remoteSucceeded: true,
      trustchainDestroyed: true,
      localWiped: true,
      recoveryWipe: true,
    });
    trackRingDestroyCancelled();

    for (const call of calls()) {
      assertNoPii(call[1]);
    }
  });
});
