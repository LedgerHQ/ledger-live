import { resolveGenuineErrorKind, type GenuineFailureName } from "./resolveGenuineErrorKind";
import type { GenuineErrorKind } from "LLM/features/DeviceOnboarding/types";

describe("resolveGenuineErrorKind", () => {
  it.each<{
    failure: GenuineFailureName;
    tag?: string;
    hasForcedProvider?: boolean;
    kind: GenuineErrorKind;
  }>([
    { failure: "GENUINE_CHECK_REFUSED", kind: "declined" },
    { failure: "DEVICE_NOT_GENUINE", kind: "notGenuine" },
    { failure: "GENUINE_CHECK_FAILED", kind: "unknown" },
    { failure: "SECURE_CHANNEL_LOST", kind: "unknown" },
    {
      failure: "GENUINE_CHECK_FAILED",
      tag: "FetchError",
      hasForcedProvider: true,
      kind: "provider",
    },
    { failure: "GENUINE_CHECK_FAILED", tag: "FetchError", kind: "network" },
    { failure: "SECURE_CHANNEL_LOST", tag: "WebSocketConnectionError", kind: "network" },
    { failure: "GENUINE_CHECK_FAILED", tag: "UnmappedError", kind: "unknown" },
  ])("maps $failure ($tag) to $kind", ({ failure, tag, hasForcedProvider = false, kind }) => {
    expect(resolveGenuineErrorKind(failure, tag ? { _tag: tag } : null, hasForcedProvider)).toBe(
      kind,
    );
  });
});
