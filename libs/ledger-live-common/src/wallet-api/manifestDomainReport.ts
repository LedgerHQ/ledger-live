import { isUrlAllowedByManifestDomains } from "./manifestDomainUtils";

/** Datadog RUM action name of every manifest domain check report. */
export const DOMAIN_CHECK_VIOLATION_ACTION = "live_app_domain_check_violation";

export type DomainCheckPlatform = "desktop" | "ios" | "android";

export type DomainCheckFrameType = "main_frame" | "sub_frame" | "unknown";

/** `navigation`: a frame load. `bridge`: a Wallet API / Platform API message. */
export type DomainCheckKind = "navigation" | "bridge";

/**
 * `would_block`: allowed today, rejected by the strict list (report-only).
 * `blocked`: a navigation the domain check cancelled. `dropped`: a bridge message it ignored.
 */
export type DomainCheckOutcome = "would_block" | "blocked" | "dropped";

/**
 * Everything a report carries. Never add a full URL, a path or a query string:
 * they can hold addresses, tokens or session ids.
 */
export type DomainCheckViolation = {
  origin: string;
  manifestId: string;
  appVersion: string;
  platform: DomainCheckPlatform;
  frameType: DomainCheckFrameType;
  kind: DomainCheckKind;
  outcome: DomainCheckOutcome;
};

const ANY_HOST_PATTERN = /^(https?:\/\/\*?|\*)$/;

/**
 * The manifest domains without the entries that match any host ("https://", "https://*",
 * "*"), which the domain check is meant to stop accepting.
 */
export function getStrictManifestDomains(domains: readonly string[] | undefined): string[] {
  return (domains ?? []).filter(domain => !ANY_HOST_PATTERN.test(domain.trim()));
}

export function isUrlAllowedByStrictManifestDomains(
  url: string,
  domains: readonly string[] | undefined,
): boolean {
  return isUrlAllowedByManifestDomains(url, getStrictManifestDomains(domains));
}

/**
 * The origin of a URL, safe to report: no path, query or fragment. Opaque URLs
 * (about:, data:, blob:, custom schemes) report their scheme only.
 */
export function getReportableOrigin(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "invalid";
  }
  if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.origin;
  return parsed.protocol;
}

const MAX_REPORTED_KEYS = 500;

/**
 * Wraps a sender so each distinct violation is sent once: a page that retries a
 * blocked load in a loop must not flood Datadog.
 */
export function createDomainCheckReporter(
  send: (violation: DomainCheckViolation) => void,
): (violation: DomainCheckViolation) => void {
  const reported = new Set<string>();
  return violation => {
    const key = [
      violation.manifestId,
      violation.kind,
      violation.outcome,
      violation.frameType,
      violation.origin,
    ].join("|");
    if (reported.has(key) || reported.size >= MAX_REPORTED_KEYS) return;
    reported.add(key);
    send(violation);
  };
}
