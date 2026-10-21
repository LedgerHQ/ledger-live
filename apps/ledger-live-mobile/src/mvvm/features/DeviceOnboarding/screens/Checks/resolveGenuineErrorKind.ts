import type { GenuineErrorKind } from "LLM/features/DeviceOnboarding/types";

export type GenuineFailureName =
  | "GENUINE_CHECK_REFUSED"
  | "GENUINE_CHECK_FAILED"
  | "DEVICE_NOT_GENUINE"
  | "SECURE_CHANNEL_LOST";

type TaggedError = Readonly<{ _tag?: string }>;

export function resolveGenuineErrorKind(
  failure: GenuineFailureName,
  error: TaggedError | null,
  hasForcedProvider: boolean,
): GenuineErrorKind {
  if (failure === "GENUINE_CHECK_REFUSED") return "declined";
  if (failure === "DEVICE_NOT_GENUINE") return "notGenuine";
  if (error?._tag === "FetchError") return hasForcedProvider ? "provider" : "network";
  if (error?._tag === "WebSocketConnectionError") return "network";
  return "unknown";
}
