import type { ContentAbTests } from "./parse";

export type ContentAbTestCopyOverrides = Readonly<Record<string, string>>;

export function buildContentAbTestCopyOverrides(
  payloads: ContentAbTests,
): ContentAbTestCopyOverrides {
  const entries = Object.values(payloads).flatMap(payload =>
    payload.enabled ? Object.entries(payload.copy) : [],
  );
  return Object.freeze(Object.fromEntries(entries));
}
