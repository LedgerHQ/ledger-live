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

  it("ring_init_started carries only non-PII booleans", () => {
    trackRingInitStarted({ passwordProtected: true, usedCustomName: false });
    expect(calls()).toHaveLength(1);
    expect(calls()[0][0]).toBe("ring_init_started");
    expect(calls()[0][1]).toEqual({
      page: "Ring - Init",
      passwordProtected: true,
      usedCustomName: false,
    });
  });

  it("ring_init_completed carries only the passwordProtected flag", () => {
    trackRingInitCompleted({ passwordProtected: false });
    expect(calls()[0][0]).toBe("ring_init_completed");
    expect(calls()[0][1]).toEqual({
      page: "Ring - Init",
      passwordProtected: false,
    });
  });

  it("ring_encrypt carries only io enums and the newKey flag", () => {
    trackRingEncrypt({ inputSource: "file", outputDest: "stdout", newKey: true });
    expect(calls()[0][0]).toBe("ring_encrypt");
    expect(calls()[0][1]).toEqual({
      page: "Ring - Encrypt",
      inputSource: "file",
      outputDest: "stdout",
      newKey: true,
    });
  });

  it("ring_decrypt carries only io enums", () => {
    trackRingDecrypt({ inputSource: "stdin", outputDest: "file" });
    expect(calls()[0][0]).toBe("ring_decrypt");
    expect(calls()[0][1]).toEqual({
      page: "Ring - Decrypt",
      inputSource: "stdin",
      outputDest: "file",
    });
  });

  it("ring_keys_viewed carries only the key count, never key names", () => {
    trackRingKeysViewed({ keysCount: 3 });
    expect(calls()[0][0]).toBe("ring_keys_viewed");
    expect(calls()[0][1]).toEqual({
      page: "Ring - Keys",
      keysCount: 3,
    });
  });

  it("ring_destroy_started carries only the passwordProtected flag", () => {
    trackRingDestroyStarted({ passwordProtected: true });
    expect(calls()[0][0]).toBe("ring_destroy_started");
    expect(calls()[0][1]).toEqual({
      page: "Ring - Destroy",
      passwordProtected: true,
    });
  });

  it("ring_destroy_completed carries only outcome booleans", () => {
    trackRingDestroyCompleted({
      remoteSucceeded: true,
      trustchainDestroyed: true,
      localWiped: true,
      recoveryWipe: false,
    });
    expect(calls()[0][0]).toBe("ring_destroy_completed");
    expect(calls()[0][1]).toEqual({
      page: "Ring - Destroy",
      remoteSucceeded: true,
      trustchainDestroyed: true,
      localWiped: true,
      recoveryWipe: false,
    });
  });

  it("ring_destroy_cancelled carries only the page", () => {
    trackRingDestroyCancelled();
    expect(calls()[0][0]).toBe("ring_destroy_cancelled");
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
